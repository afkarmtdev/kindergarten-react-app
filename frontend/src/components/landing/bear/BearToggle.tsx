import { BearLogo } from './BaseBearMascot'

interface Props {
  visible: boolean
  onToggle: () => void
}

export function BearToggle({ visible, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="hidden lg:flex items-center gap-1.5 absolute bottom-5 right-5 z-10
        px-2.5 py-1 rounded-full text-[10px] font-semibold
        bg-white/60 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-700/60
        text-gray-400 dark:text-gray-500
        opacity-30 hover:opacity-90 transition-opacity"
      title={visible ? 'Hide bear mascot' : 'Show bear mascot'}
    >
      <BearLogo size={11} />
      {visible ? 'hide' : 'show'}
    </button>
  )
}
