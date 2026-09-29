"""OpenCV Zoo YuNet/SFace adapter. Uploaded frames are decoded only in memory."""
from functools import lru_cache
from pathlib import Path
import math

from fastapi import HTTPException

from app.config import get_settings

MODEL_VERSION = "opencv-zoo-sface-2021dec"
MAX_FRAME_BYTES = 2_000_000


@lru_cache(maxsize=1)
def models():
    try:
        import cv2
    except ImportError as exc:
        raise HTTPException(503, "Face service is not configured") from exc
    root = get_settings().face_model_pack
    if not root:
        raise HTTPException(503, "Face service is not configured")
    folder = Path(root)
    detector_path = folder / "face_detection_yunet_2023mar.onnx"
    recognizer_path = folder / "face_recognition_sface_2021dec.onnx"
    if not detector_path.is_file() or not recognizer_path.is_file():
        raise HTTPException(503, "Face models are unavailable")
    try:
        return cv2, cv2.FaceDetectorYN.create(str(detector_path), "", (320, 320)), cv2.FaceRecognizerSF.create(str(recognizer_path), "")
    except Exception as exc:
        raise HTTPException(503, "Face models could not be loaded") from exc


def frame_features(raw: bytes) -> tuple[list[float], float]:
    """Return a normalized 128-d SFace embedding and approximate head yaw."""
    if not raw or len(raw) > MAX_FRAME_BYTES:
        raise HTTPException(422, "Frame must be a nonempty image smaller than 2 MB")
    cv2, detector, recognizer = models()
    import numpy as np
    image = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None or image.shape[0] < 80 or image.shape[1] < 80:
        raise HTTPException(422, "Invalid or too small face image")
    detector.setInputSize((image.shape[1], image.shape[0]))
    _, faces = detector.detect(image)
    if faces is None or len(faces) != 1:
        raise HTTPException(422, "Exactly one face must be visible")
    face = faces[0]
    if float(face[-1]) < (get_settings().face_min_det_score or 0.8):
        raise HTTPException(422, "Face detection confidence is too low")
    aligned = recognizer.alignCrop(image, face)
    embedding = recognizer.feature(aligned).flatten().astype(float)
    if embedding.size != 128:
        raise HTTPException(503, "Face model produced an incompatible embedding")
    norm = float(np.linalg.norm(embedding))
    if not math.isfinite(norm) or norm == 0:
        raise HTTPException(422, "Face could not be encoded")
    # YuNet: right eye, left eye, nose, right mouth, left mouth.
    right_eye_x, left_eye_x, nose_x = float(face[4]), float(face[6]), float(face[8])
    eye_span = abs(left_eye_x - right_eye_x)
    midpoint = (right_eye_x + left_eye_x) / 2
    yaw = (nose_x - midpoint) / eye_span if eye_span else 0.0
    return (embedding / norm).tolist(), yaw


def cosine(a: list[float], b: list[float]) -> float:
    if len(a) != 128 or len(b) != 128:
        return -1.0
    return sum(float(x) * float(y) for x, y in zip(a, b))


def mean_embedding(embeddings: list[list[float]]) -> list[float]:
    if len(embeddings) != 3 or any(len(item) != 128 for item in embeddings):
        raise HTTPException(422, "Three valid face frames are required")
    mean = [sum(frame[i] for frame in embeddings) / 3 for i in range(128)]
    norm = math.sqrt(sum(x * x for x in mean))
    if norm == 0:
        raise HTTPException(422, "Face frames could not be combined")
    return [x / norm for x in mean]
