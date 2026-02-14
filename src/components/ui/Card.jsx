export default function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-card p-4 sm:p-6 transition-all duration-300 hover:shadow-card-hover border border-darkGreen/[0.04] ${className}`}
    >
      {children}
    </div>
  )
}
