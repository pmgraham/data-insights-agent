import { ReactNode } from 'react';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
  onNewChat?: () => void;
}

export function AppLayout({ children, onNewChat }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header onNewChat={onNewChat} />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
