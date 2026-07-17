export default function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card" style={{ marginBottom: 10 }} key={i}>
          <div style={{ display: "flex", gap: 10 }}>
            <div
              className="skeleton"
              style={{ width: 42, height: 42, borderRadius: "50%" }}
            />
            <div style={{ flex: 1 }}>
              <div
                className="skeleton"
                style={{ height: 16, width: "55%", marginBottom: 8 }}
              />
              <div
                className="skeleton"
                style={{ height: 12, width: "80%", marginBottom: 8 }}
              />
              <div
                className="skeleton"
                style={{ height: 20, width: 130, borderRadius: 999 }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
