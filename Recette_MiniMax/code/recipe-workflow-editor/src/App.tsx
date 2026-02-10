import { useState } from 'react';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import RecipePanel from './components/RecipePanel';
import OperationsPanel from './components/OperationsPanel';
import Canvas from './components/Canvas';
import LibraryPanel from './components/LibraryPanel';
import BottomToolbar from './components/BottomToolbar';
import ChatPanel from './components/ChatPanel';

// Versioning components
import VersionHistoryPanel from './components/versioning/VersionHistoryPanel';
import CommitDialog from './components/versioning/CommitDialog';
import DiffViewer from './components/versioning/DiffViewer';
import BranchManager from './components/versioning/BranchManager';
import RestoreConfirmDialog from './components/versioning/RestoreConfirmDialog';
import MergeDialog from './components/versioning/MergeDialog';
import { useVersioningInit } from './versioning/hooks';

export default function App() {
  const [, setActivePanel] = useState('livraison');

  // Initialize versioning for existing recipes
  useVersioningInit();

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F5] overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden relative">
        {/* Floating Left Sidebar */}
        <LeftSidebar onActiveChange={setActivePanel} />

        {/* Main content area with padding for floating sidebar */}
        <div className="flex-1 flex pl-14 lg:pl-20 pr-2 lg:pr-4 py-4 gap-2 lg:gap-4">
          {/* Floating Panels Container */}
          <div className="flex gap-2 lg:gap-4 items-start">
            <RecipePanel />
            <OperationsPanel />
          </div>

          {/* Canvas fills remaining space */}
          <div className="flex-1">
            <Canvas />
          </div>

          {/* Right Panel - Livraison (renamed from Library) */}
          <LibraryPanel />
        </div>
      </div>
      <BottomToolbar />
      <ChatPanel />

      {/* Versioning overlays */}
      <VersionHistoryPanel />
      <CommitDialog />
      <DiffViewer />
      <BranchManager />
      <RestoreConfirmDialog />
      <MergeDialog />
    </div>
  );
}
