import logo from '@/assets/logo.png';

interface LogoProps {
  className?: string;
  alt?: string;
}

const Logo = ({ className = 'w-10 h-10', alt = 'לישנא' }: LogoProps) => (
  <img src={logo} alt={alt} className={`${className} object-contain select-none`} draggable={false} />
);

export default Logo;
