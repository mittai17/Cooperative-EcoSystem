import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { FeatureStubScreen } from '../../components/FeatureStubScreen';
import { RootStackParamList } from '../../navigation/types';

export const LearnTabScreen = () => (
  <FeatureStubScreen
    title="Interactive E-Learning"
    category="WP3 Multilingual LMS"
    subtitle="Accredited courses, interactive lessons, offline packages and quizzes."
    tab
  />
);

export const CourseDetailScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'CourseDetail'>>();
  return (
    <FeatureStubScreen
      title="Course Curriculum"
      category="WP3 Multilingual LMS"
      subtitle="Modules, lesson outlines, estimated duration, and language tracks."
      params={route.params}
    />
  );
};

export const LessonPlayerScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'LessonPlayer'>>();
  return (
    <FeatureStubScreen
      title="Lesson Player"
      category="WP3 Multilingual LMS"
      subtitle="Interactive blocks: video, audio, flashcards, scenario decisions, and quizzes."
      params={route.params}
    />
  );
};
