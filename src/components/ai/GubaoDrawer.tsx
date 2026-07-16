import { GitBranch } from 'lucide-react'
import { GubaoMark } from '../brand/Gubao'
import { Drawer } from '../ui/Drawer'
import { DecisionGubaoPanel } from './DecisionGubaoPanel'

export function GubaoDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Drawer open={open} onClose={onClose} title="股寶決策助理"><div className="p-5 sm:p-6"><div className="mb-6 flex items-center gap-4 rounded-2xl border border-tech-blue/20 bg-blue-400/[.04] p-5"><GubaoMark className="h-12 w-12" /><div><h3 className="text-lg font-semibold text-white">直接引用 GULI Decision Engine</h3><p className="mt-1 flex items-center gap-2 text-sm text-slate-400"><GitBranch size={15} />DecisionRepository · DecisionResult · DecisionTrace</p></div></div><DecisionGubaoPanel /></div></Drawer>
}
