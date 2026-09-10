import Link from "next/link";
export default function Nav(){return <header className="nav"><Link className="brand" href="/"><span className="brandmark">W</span><span>WATCHTOWER</span></Link><nav><Link href="/">Overview</Link><Link href="/targets">Targets</Link></nav></header>}
