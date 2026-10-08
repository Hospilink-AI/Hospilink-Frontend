// Per-icon entry points of @tabler/icons-react-native (the package only types its barrel).
declare module '@tabler/icons-react-native/*' {
  import type { ForwardRefExoticComponent } from 'react';
  import type { SvgProps } from 'react-native-svg';

  interface IconProps extends SvgProps {
    size?: string | number;
    strokeWidth?: string | number;
    title?: string;
  }
  const Icon: ForwardRefExoticComponent<IconProps>;
  export default Icon;
}
