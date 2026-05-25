import Image from 'next/image';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex items-center">
      <Image
        src="/logo.png"
        alt="VedaAI Logo"
        width={180}
        height={62}
        className="object-contain w-auto h-[56px] md:h-[60px]"
        priority
      />
    </div>
  );
}

export default Logo;
