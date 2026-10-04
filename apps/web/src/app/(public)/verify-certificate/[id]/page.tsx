import { VerifyCertificateView } from "./verify-certificate-view";

export default async function VerifyCertificatePage({
  params,
}: PageProps<"/verify-certificate/[id]">) {
  const { id } = await params;
  return <VerifyCertificateView id={id} />;
}
