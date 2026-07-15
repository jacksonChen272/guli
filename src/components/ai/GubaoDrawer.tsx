import { GitBranch } from 'lucide-react'
import { GubaoMark } from '../brand/Gubao'
import { Drawer } from '../ui/Drawer'
import { DecisionGubaoPanel } from './DecisionGubaoPanel'

export function GubaoDrawer({ open, onClose }:{ open:boolean; onClose:()=>void }) {
  return <Drawer open={open} onClose={onClose} title="股寶決策助理"><div className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-4 rounded-2xl border border-tech-blue/20 bg-blue-400/[.04] p-4"><GubaoMark className="h-12 w-12"/><div><h3 className="text-sm font-semibold text-white">直接引用 GULI Decision Engine</h3><p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500"><GitBranch size={12}/>DecisionRepository · DecisionResult · DecisionTrace</p></div></div><DecisionGubaoPanel/></div></Drawer>
}
