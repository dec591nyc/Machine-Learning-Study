import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, GitCompareArrows, Github, Home, Network } from "@/components/icons";
import { AiAssistant } from "@/components/ai-assistant";

import "./globals.css";

export const metadata: Metadata = {
  title: "Industry ML Workbench | 機器學習業界實務展示",
  description: "從業界問題、模型選擇到參數影響的互動式機器學習展示網站。",
};

const navItems = [
  { href: "/", label: "實務首頁", icon: Home },
  { href: "/models", label: "模型圖鑑", icon: Network },
  { href: "/selector", label: "模型選擇", icon: GitCompareArrows },
  { href: "/compare", label: "模型比較", icon: GitCompareArrows },
  { href: "/lab", label: "參數實驗", icon: FlaskConical },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a className="skip-link" href="#main-content">跳至主要內容</a>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/" aria-label="回到 Industry ML Workbench 首頁">
              <span className="brand-mark"><Network size={22} aria-hidden="true" /></span>
              <span><strong>Industry ML</strong><small>Workbench</small></span>
            </Link>
            <nav className="main-nav" aria-label="主要導覽">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}><Icon size={17} aria-hidden="true" /><span>{label}</span></Link>
              ))}
            </nav>
            <div className="header-actions">
              <AiAssistant />
              <a
                className="github-link"
                href="https://github.com/dec591nyc/Machine-Learning-Study"
                target="_blank"
                rel="noreferrer"
                aria-label="在 GitHub 開啟 Machine-Learning-Study repository"
              ><Github size={22} /><span>GitHub</span></a>
            </div>
          </div>
        </header>
        <main id="main-content">{children}</main>
        <footer className="site-footer">
          <div><strong>Industry ML Workbench</strong><p>以業界問題、參數影響與部署限制理解機器學習。</p></div>
        </footer>
      </body>
    </html>
  );
}
