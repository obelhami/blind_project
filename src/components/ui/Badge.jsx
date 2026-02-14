export default function Badge({ children, variant = 'active' }) {
  const variants = {
    active: 'bg-primaryGreen/15 text-primaryGreen',
    claimed: 'bg-darkGreen/15 text-darkGreen',
  }
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
        variants[variant] || variants.active
      }`}
    >
      {children}
    </span>
  )
}
