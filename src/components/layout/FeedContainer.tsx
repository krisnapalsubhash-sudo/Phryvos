export default function FeedContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {children}
    </div>
  );
}
