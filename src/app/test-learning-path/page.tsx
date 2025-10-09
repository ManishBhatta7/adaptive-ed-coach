import { useState } from 'react';
import LearningPathCurator from '@/components/learning-style/LearningPathCurator';
import LearningPathBrowser from '@/components/learning-style/LearningPathBrowser';
import { InteractiveLearningPath } from '@/components/learning-style/InteractiveLearningPath';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ErrorBoundary from '@/components/error/ErrorBoundary';

export default function TestLearningPath() {
  const [mode, setMode] = useState<'create' | 'view'>('create');
  const [createdPath, setCreatedPath] = useState(null);

  const handlePathCreated = (path: any) => {
    setCreatedPath(path);
    setMode('view');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">🎮 Build Your Learning Adventure!</h1>
        <div className="space-x-4 flex">
          <button
            onClick={() => setMode('create')}
            className={`px-6 py-3 rounded-lg font-bold shadow transition-all duration-200 border-2 border-blue-400 hover:bg-blue-500 hover:text-white bg-gradient-to-r from-blue-100 to-purple-100 ${mode === 'create' ? 'scale-105 ring-2 ring-blue-400' : ''}`}
          >
            🛠️ Create Learning Path
          </button>
          <button
            onClick={() => setMode('view')}
            className={`px-6 py-3 rounded-lg font-bold shadow transition-all duration-200 border-2 border-green-400 hover:bg-green-500 hover:text-white bg-gradient-to-r from-green-100 to-yellow-100 ${mode === 'view' ? 'scale-105 ring-2 ring-green-400' : ''}`}
            disabled={!createdPath}
          >
            👀 View Learning Path
          </button>
        </div>
      </div>

      <ErrorBoundary>
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse">🔍 Browse Paths</TabsTrigger>
            <TabsTrigger value="create">✨ Create New Path</TabsTrigger>
            {createdPath && <TabsTrigger value="view">👀 View Path</TabsTrigger>}
          </TabsList>

          <TabsContent value="browse">
            <ErrorBoundary>
              <LearningPathBrowser onPathSelect={handlePathCreated} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="create">
            <ErrorBoundary>
              <LearningPathCurator onPathCreated={handlePathCreated} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="view">
            {createdPath && (
              <ErrorBoundary>
                <InteractiveLearningPath
                  pathId={createdPath.id}
                  studentId="test-student"
                  title={createdPath.title}
                  description={createdPath.description}
                  steps={createdPath.steps}
                />
              </ErrorBoundary>
            )}
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </div>
  );
}