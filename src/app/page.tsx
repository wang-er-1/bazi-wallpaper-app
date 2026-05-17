"use client";

import { useState } from "react";

type Screen = "home" | "birth" | "analyzing" | "recommend" | "result" | "pay";
type ElementName = "木" | "火" | "土" | "金" | "水";

type AnalyzeRequest = {
  calendarType: string;
  birthDate: string;
  birthTime: string;
  gender: string;
};

type WallpaperPreview = {
  title: string;
  basis: string;
  visual: string;
  cls: string;
  prompt: string;
  imageUrl?: string;
};

type AnalyzeResult = {
  bazi: string;
  baziDetail: { year: string; month: string; day: string; time: string };
  elementCounts: Record<ElementName, number>;
  elementSummary: string;
  monthRelation: string;
  themeTitle: string;
  themeCopy: string;
  reasoning: string;
  previews: WallpaperPreview[];
};

const elements: ElementName[] = ["木", "火", "土", "金", "水"];
const heroStyles = ["nature", "abstract", "minimal"];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [quota, setQuota] = useState(20);
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<WallpaperPreview | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationNote, setGenerationNote] = useState("");
  const [form, setForm] = useState<AnalyzeRequest>({
    calendarType: "阳历",
    birthDate: "1996-08-18",
    birthTime: "08:30",
    gender: "女",
  });

  const selectedTitle = selectedPreview?.title ?? "专属风格";
  const primaryPreview = analysis?.previews[0] ?? null;
  const backupPreviews = analysis?.previews.slice(1) ?? [];

  function go(next: Screen) {
    if ((next === "recommend" || next === "result") && !analysis) {
      setScreen("birth");
      return;
    }
    setScreen(next);
  }

  function selectPreview(item: WallpaperPreview) {
    setSelectedPreview(item);
    setGeneratedImageUrl("");
    setGenerationNote("");
    setScreen("result");
  }

  async function downloadWallpaper() {
    if (!generatedImageUrl) return;
    const response = await fetch(generatedImageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedTitle}-好运壁纸.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function startAnalyze() {
    setScreen("analyzing");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("分析失败");
      const data = (await response.json()) as AnalyzeResult;
      const firstPreview = data.previews[0] ?? null;
      setAnalysis(data);
      setSelectedPreview(firstPreview);
      setGeneratedImageUrl("");
      setGenerationNote("");
      setDetailOpen(false);
      setThinkingOpen(false);
      setScreen("recommend");
    } catch {
      setAnalysis(null);
      setScreen("birth");
      window.alert("分析暂时失败，请稍后再试。");
    }
  }

  async function generateWallpaper() {
    if (quota <= 0) {
      setScreen("pay");
      return;
    }

    if (!selectedPreview) return;

    setGenerating(true);
    setGenerationNote("正在生成高清壁纸，通常需要 30-120 秒。");

    try {
      const response = await fetch("/api/generate-wallpaper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedPreview),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string; detail?: string; model?: string; size?: string } | null;
        const detail = [errorData?.error, errorData?.detail, errorData?.model ? `model=${errorData.model}` : "", errorData?.size ? `size=${errorData.size}` : ""].filter(Boolean).join("\n");
        throw new Error(detail || "生成失败");
      }

      const data = (await response.json()) as { imageUrl: string; message?: string; mode?: string };
      setGeneratedImageUrl(data.imageUrl);
      setGenerationNote(data.message || (data.mode === "real" ? "高清壁纸已生成。" : ""));
      setQuota((current) => current - 1);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "图片生成暂时失败，请稍后再试。");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="phone-app">
      <section className={`screen ${screen === "home" ? "active" : ""}`}>
        <header className="hero-topbar">
          <div>
            <p className="eyebrow">今日壁纸</p>
            <h1>先看见今天的好运</h1>
          </div>
          <button className="quota-pill" onClick={() => go("pay")}>
            <span>{quota}</span> 张
          </button>
        </header>

        <section className="hero-wallpapers" aria-label="壁纸样张">
          {heroStyles.map((style, index) => (
            <article className={`hero-wallpaper ${style}`} key={style}>
              {index === 0 ? <span>今日推荐</span> : null}
            </article>
          ))}
        </section>

        <section className="hero-copy">
          <em className="model-badge">gpt-image-2</em>
          <p>根据生日，生成今天适合你的高清壁纸。</p>
          <button className="primary wide" onClick={() => go("birth")}>查看我的风格</button>
        </section>
      </section>

      <section className={`screen ${screen === "birth" ? "active" : ""}`}>
        <header className="page-head minimal-head">
          <p className="eyebrow">生成</p>
          <h1>填写生日</h1>
          <p>只用必要信息，先判断适合你的视觉方向。</p>
        </header>

        <section className="form-card compact-form">
          <label>历法<select value={form.calendarType} onChange={(event) => setForm((current) => ({ ...current, calendarType: event.target.value }))}><option>阳历</option><option>农历</option></select></label>
          <label>出生日期<input type="date" value={form.birthDate} onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))} /></label>
          <label>出生时间<input type="time" value={form.birthTime} onChange={(event) => setForm((current) => ({ ...current, birthTime: event.target.value }))} /></label>
          <label>性别<select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}><option>女</option><option>男</option><option>不填写</option></select></label>
          <button className="primary wide" onClick={startAnalyze}>查看我的壁纸风格</button>
        </section>
      </section>

      <section className={`screen ${screen === "analyzing" ? "active" : ""}`}> 
        <div className="loading-card"><div className="spinner" /><h1>正在匹配</h1><p>结合生日和今天的时间气息，挑出更适合你的画面。</p></div>
      </section>

      <section className={`screen ${screen === "recommend" ? "active" : ""}`}>
        <header className="page-head minimal-head">
          <p className="eyebrow">推荐风格</p>
          <h1>适合你的今天</h1>
        </header>
        {analysis && primaryPreview ? <>
          <section className="featured-recommend">
            <article className={`feature-art ${primaryPreview.cls}`}>{primaryPreview.imageUrl ? <img src={primaryPreview.imageUrl} alt={primaryPreview.title} /> : null}</article>
            <div className="feature-copy">
              <em className="model-badge">gpt-image-2</em>
              <h2>{primaryPreview.title}</h2>
              <p>{analysis.themeCopy}</p>
              <button className="primary wide" onClick={() => selectPreview(primaryPreview)}>用这个风格生成</button>
            </div>
          </section>

          <button className="why-toggle" onClick={() => setDetailOpen((open) => !open)}>{detailOpen ? "收起推荐依据" : "为什么推荐这个"}</button>
          {detailOpen ? <section className="reason-panel">
            <h3>{analysis.themeTitle}</h3>
            <p>{analysis.elementSummary}</p>
            <div className="pillar-grid"><span>年柱：{analysis.baziDetail.year}</span><span>月柱：{analysis.baziDetail.month}</span><span>日柱：{analysis.baziDetail.day}</span><span>时柱：{analysis.baziDetail.time}</span></div>
            <div className="element-bars">{elements.map((item) => <div className="element-row" key={item}><span>{item}</span><div><i style={{ width: `${Math.max(12, analysis.elementCounts[item] * 12)}%` }} /></div><b>{analysis.elementCounts[item]}</b></div>)}</div>
            <button className="text-btn" onClick={() => setThinkingOpen((open) => !open)}>{thinkingOpen ? "收起分析过程" : "查看分析过程"}</button>
            {thinkingOpen ? <p className="thinking-text">{analysis.reasoning}</p> : null}
          </section> : null}

          {backupPreviews.length ? <section className="alternate-section"><div className="section-title slim"><h2>换个方向</h2><span>横滑选择</span></div><div className="alternate-list">{backupPreviews.map((item) => <article className={`alternate-card ${item.cls}`} key={item.title}><div className="alternate-art">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : null}</div><h3>{item.title}</h3><p>{item.visual}</p><button onClick={() => selectPreview(item)}>选择</button></article>)}</div></section> : null}
        </> : null}
      </section>

      <section className={`screen ${screen === "result" ? "active" : ""}`}>
        <header className="page-head result-head">
          <p className="eyebrow">高清壁纸</p>
          <h1>{selectedTitle}</h1>
          <p>生成一张 9:16 竖屏图。</p>
        </header>
        <section className="single-wallpaper-wrap">
          {generatedImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="generated-wallpaper" src={generatedImageUrl} alt={`${selectedTitle}壁纸`} />
          ) : (
            <article className={`wallpaper single ${selectedPreview?.cls ?? "nature"}`}><span>{selectedTitle}</span></article>
          )}
        </section>
        {generationNote ? <p className="generation-note">{generationNote}</p> : null}
        <button className="primary wide" onClick={generateWallpaper} disabled={generating}>{generating ? "生成中..." : quota > 0 ? "生成高清壁纸" : "额度已用完"}</button>
        <div className="result-actions">{generatedImageUrl ? <button onClick={downloadWallpaper}>下载</button> : <button onClick={() => go("recommend")}>换风格</button>}<button onClick={() => go("pay")}>购买额度</button></div>
      </section>

      <section className={`screen ${screen === "pay" ? "active" : ""}`}>
        <header className="page-head minimal-head"><p className="eyebrow">我的</p><h1>购买额度</h1><p>先用两个简单档位测试转化。</p></header>
        <section className="pay-grid"><button><b>1 元</b><span>5 张</span></button><button><b>10 元</b><span>50 张</span></button></section>
      </section>

      <nav className="bottom-nav">
        <button className={screen === "home" ? "active" : ""} onClick={() => go("home")}><span className="nav-icon home-icon" />今日</button>
        <button className={screen === "birth" || screen === "recommend" || screen === "result" ? "active" : ""} onClick={() => go("birth")}><span className="nav-icon birth-icon" />生成</button>
        <button className={screen === "pay" ? "active" : ""} onClick={() => go("pay")}><span className="nav-icon user-icon" />我的</button>
      </nav>
    </main>
  );
}