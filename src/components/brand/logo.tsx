import Image from "next/image";

type LogoProps = {
  variant: "icon" | "full";
  size?: number;
  className?: string;
};

const config = {
  icon: { src: "/brand/logo-icon.svg", ratio: 80 / 60 },
  full: { src: "/brand/logo-full.svg", ratio: 260 / 100 },
} as const;

export function Logo({ variant, size = 40, className }: LogoProps) {
  const { src, ratio } = config[variant];
  const width = Math.round(size * ratio);

  return (
    <Image
      src={src}
      alt="Logo ConCordia"
      width={width}
      height={size}
      className={className}
      priority
    />
  );
}
