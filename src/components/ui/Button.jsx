export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'rounded-xl px-5 py-2.5 font-medium text-[15px] transition-all duration-200 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-primaryGreen text-white shadow-sm',
    secondary: 'bg-darkGreen text-white shadow-sm',
  }
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  )
}
