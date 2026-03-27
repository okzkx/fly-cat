export interface BrandMarkProps {
  size?: number;
}

export default function BrandMark({ size = 32 }: BrandMarkProps): React.JSX.Element {
  return (
    <div
      aria-label="飞猫助手"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: "linear-gradient(135deg, #1677ff 0%, #36cfc9 100%)",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(12, Math.round(size * 0.36)),
        fontWeight: 700,
        lineHeight: 1,
        userSelect: "none"
      }}
    >
      FC
    </div>
  );
}
