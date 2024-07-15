import { motion } from 'framer-motion';
import { FC, useState } from 'react';

interface Props {
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  value?: string;
  onClick?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
  type?: string;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const SearchBox: FC<Props> = ({
  onChange,
  onKeyDown,
  onClick,
  value,
  id,
  className,
  placeholder,
  ariaLabel,
  ariaDescribedBy,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <motion.input
      style={{
        zIndex: -1,
      }}
      onKeyDown={onKeyDown}
      type="text"
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={onClick}
      value={value}
      onChange={onChange}
      id={id}
      className={className}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      animate={{ width: isFocused ? '300px' : '200px' }}
      transition={{ duration: 0.15 }}
    />
  );
};
