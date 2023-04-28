import { FC, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  value?: string;
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
  value,
  id,
  type,
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
      onKeyDown={onKeyDown}
      type="text"
      onFocus={handleFocus}
      onBlur={handleBlur}
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
