import React from 'react';

export const IPME_OFFICIAL_LOGO_PATH = '/logo-ipme.png';

interface IpmeLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
  alt?: string;
}

export const IpmeLogo: React.FC<IpmeLogoProps> = ({
  size = 'md',
  className = '',
  showBorder = true,
  alt = 'Logomarca Oficial IPME - Instituto de Previdência do Município de Eusébio'
}) => {
  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
  }[size];

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 bg-white overflow-hidden rounded-xl ${
        showBorder ? 'border border-slate-200 shadow-2xs' : ''
      } ${sizeClasses} ${className}`}
    >
      <img
        src={IPME_OFFICIAL_LOGO_PATH}
        alt={alt}
        className="w-full h-full object-contain p-0.5"
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Graceful fallback to relative path if absolute asset resolution varies
          const target = e.target as HTMLImageElement;
          if (target.src !== '/logo-ipme.png') {
            target.src = '/logo-ipme.png';
          }
        }}
      />
    </div>
  );
};
