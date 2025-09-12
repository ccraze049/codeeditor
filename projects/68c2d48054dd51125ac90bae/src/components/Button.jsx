import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  onClick,
  disabled = false,
  ...props 
}) => {
  const getButtonStyles = () => {
    const baseStyles = {
      padding: size === 'small' ? '8px 16px' : size === 'large' ? '16px 32px' : '12px 24px',
      fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
      border: 'none',
      borderRadius: '6px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      opacity: disabled ? 0.6 : 1,
    };

    const variantStyles = {
      primary: {
        backgroundColor: '#007bff',
        color: 'white',
      },
      secondary: {
        backgroundColor: '#6c757d',
        color: 'white',
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#007bff',
        border: '2px solid #007bff',
      },
    };

    return { ...baseStyles, ...variantStyles[variant] };
  };

  return (
    <button
      style={getButtonStyles()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;