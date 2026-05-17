/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

type Screen = "home" | "birth" | "analyzing" | "recommend" | "result" | "pay";
type ElementName = "\u6728" | "\u706b" | "\u571f" | "\u91d1" | "\u6c34";

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

const elements: ElementName[] = ["\u6728", "\u706b", "\u571f", "\u91d1", "\u6c34"];
const heroSamples = [
  {
    cls: "nature",
    title: "\u4eca\u65e5\u63a8\u8350",
    imageUrl: "https://webstatic.aiproxy.vip/output/20260517/128382/8a9f44cd-1f41-48a1-85e5-9cf457aa94f0/983b7c26-26b1-49a4-b340-03771c5e94c2.png",
  },
  {
    cls: "ink",
    title: "\u5c71\u6c34\u7559\u767d",
    imageUrl: "https://webstatic.aiproxy.vip/output/20260517/128382/3ff4f7d7-8e93-4207-b315-ce79b62e1478/0e178bf1-dee1-423c-bfab-5d878be63f02.png",
  },
  {
    cls: "cute",
    title: "\u6cbb\u6108\u690d\u7269",
    imageUrl: "https://webstatic.aiproxy.vip/output/20260517/128382/33e9be24-99f3-41c4-b03d-c56bac6397ee/bb7b10c9-95b1-40be-b8b2-2285136182e0.png",
  },
];

const birthTimeRanges = Array.from({ length: 24 }, (_, hour) => {
  const nextHour = (hour + 1) % 24;
  const value = `${String(hour).padStart(2, "0")}:30`;
  const label = `${hour}-${nextHour}\u70b9`;
  return { value, label };
});

function ModelBadge() {
  return <em className="model-badge"><span className="gpt-icon" aria-hidden="true">GPT</span>gpt-image-2</em>;
}

const copy = {
  todayWallpaper: "\u4eca\u65e5\u58c1\u7eb8",
  homeTitle: "\u5148\u770b\u89c1\u4eca\u5929\u7684\u597d\u8fd0",
  quotaUnit: "\u5f20",
  heroLabel: "\u4eca\u65e5\u63a8\u8350",
  heroCopy: "\u6839\u636e\u751f\u65e5\uff0c\u751f\u6210\u4eca\u5929\u9002\u5408\u4f60\u7684\u9ad8\u6e05\u58c1\u7eb8\u3002",
  viewStyle: "\u67e5\u770b\u6211\u7684\u98ce\u683c",
  generate: "\u751f\u6210",
  birthTitle: "\u586b\u5199\u751f\u65e5",
  birthCopy: "\u53ea\u7528\u5fc5\u8981\u4fe1\u606f\uff0c\u5148\u5224\u65ad\u9002\u5408\u4f60\u7684\u89c6\u89c9\u65b9\u5411\u3002",
  calendar: "\u5386\u6cd5",
  solar: "\u9633\u5386",
  lunar: "\u519c\u5386",
  birthDate: "\u51fa\u751f\u65e5\u671f",
  birthTime: "\u51fa\u751f\u65f6\u95f4",
  gender: "\u6027\u522b",
  female: "\u5973",
  male: "\u7537",
  emptyGender: "\u4e0d\u586b\u5199",
  analyzeCta: "\u67e5\u770b\u6211\u7684\u58c1\u7eb8\u98ce\u683c",
  matching: "\u6b63\u5728\u5339\u914d",
  matchingCopy: "\u7ed3\u5408\u751f\u65e5\u548c\u4eca\u5929\u7684\u65f6\u95f4\u6c14\u606f\uff0c\u6311\u51fa\u66f4\u9002\u5408\u4f60\u7684\u753b\u9762\u3002",
  recommendKicker: "\u63a8\u8350\u98ce\u683c",
  recommendTitle: "\u9002\u5408\u4f60\u7684\u4eca\u5929",
  useStyle: "\u7528\u8fd9\u4e2a\u98ce\u683c\u751f\u6210",
  collapseReason: "\u6536\u8d77\u63a8\u8350\u4f9d\u636e",
  expandReason: "\u4e3a\u4ec0\u4e48\u63a8\u8350\u8fd9\u4e2a",
  year: "\u5e74\u67f1",
  month: "\u6708\u67f1",
  day: "\u65e5\u67f1",
  time: "\u65f6\u67f1",
  collapseThinking: "\u6536\u8d77\u5206\u6790\u8fc7\u7a0b",
  expandThinking: "\u67e5\u770b\u5206\u6790\u8fc7\u7a0b",
  alternateTitle: "\u6362\u4e2a\u65b9\u5411",
  swipeHint: "\u6a2a\u6ed1\u9009\u62e9",
  choose: "\u9009\u62e9",
  resultKicker: "\u9ad8\u6e05\u58c1\u7eb8",
  resultCopy: "\u751f\u6210\u4e00\u5f20 9:16 \u7ad6\u5c4f\u56fe\u3002",
  wallpaperSuffix: "\u58c1\u7eb8",
  downloadSuffix: "\u597d\u8fd0\u58c1\u7eb8.png",
  generatingNote: "\u6b63\u5728\u751f\u6210\u9ad8\u6e05\u58c1\u7eb8\uff0c\u901a\u5e38\u9700\u8981 30-120 \u79d2\u3002",
  generated: "\u9ad8\u6e05\u58c1\u7eb8\u5df2\u751f\u6210\u3002",
  generating: "\u751f\u6210\u4e2d...",
  generateWallpaper: "\u751f\u6210\u9ad8\u6e05\u58c1\u7eb8",
  quotaEmpty: "\u989d\u5ea6\u5df2\u7528\u5b8c",
  download: "\u4e0b\u8f7d",
  changeStyle: "\u6362\u98ce\u683c",
  buyQuota: "\u8d2d\u4e70\u989d\u5ea6",
  mine: "\u6211\u7684",
  payTitle: "\u8d2d\u4e70\u989d\u5ea6",
  payCopy: "\u5148\u7528\u4e24\u4e2a\u7b80\u5355\u6863\u4f4d\u6d4b\u8bd5\u8f6c\u5316\u3002",
  analyzeFailed: "\u5206\u6790\u6682\u65f6\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002",
  imageFailed: "\u56fe\u7247\u751f\u6210\u6682\u65f6\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002",
  fail: "\u5206\u6790\u5931\u8d25",
  generateFail: "\u751f\u6210\u5931\u8d25",
};

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
    calendarType: copy.solar,
    birthDate: "1996-08-18",
    birthTime: "08:30",
    gender: copy.female,
  });

  const selectedTitle = selectedPreview?.title ?? copy.viewStyle;
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
    link.download = `${selectedTitle}-${copy.downloadSuffix}`;
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
      if (!response.ok) throw new Error(copy.fail);
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
      window.alert(copy.analyzeFailed);
    }
  }

  async function generateWallpaper() {
    if (quota <= 0) {
      setScreen("pay");
      return;
    }

    if (!selectedPreview) return;

    setGenerating(true);
    setGenerationNote(copy.generatingNote);

    try {
      const response = await fetch("/api/generate-wallpaper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedPreview),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string; detail?: string; model?: string; size?: string } | null;
        const detail = [errorData?.error, errorData?.detail, errorData?.model ? `model=${errorData.model}` : "", errorData?.size ? `size=${errorData.size}` : ""].filter(Boolean).join("\n");
        throw new Error(detail || copy.generateFail);
      }

      const data = (await response.json()) as { imageUrl: string; message?: string; mode?: string };
      setGeneratedImageUrl(data.imageUrl);
      setGenerationNote(data.message || (data.mode === "real" ? copy.generated : ""));
      if (data.mode === "real") setQuota((current) => current - 1);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : copy.imageFailed);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="phone-app">
      <section className={`screen ${screen === "home" ? "active" : ""}`}>
        <header className="hero-topbar">
          <div>
            <p className="eyebrow">{copy.todayWallpaper}</p>
            <h1>{copy.homeTitle}</h1>
          </div>
        </header>

        <section className="hero-wallpapers" aria-label={copy.todayWallpaper}>
          {heroSamples.map((item, index) => (
            <article className={`hero-wallpaper ${item.cls}`} key={item.title}>
              <img src={item.imageUrl} alt={item.title} />
              {index === 0 ? <span>{copy.heroLabel}</span> : null}
            </article>
          ))}
        </section>

        <section className="hero-copy">
          <ModelBadge />
          <p>{copy.heroCopy}</p>
          <button className="primary wide" onClick={() => go("birth")}>{copy.viewStyle}</button>
        </section>
      </section>

      <section className={`screen ${screen === "birth" ? "active" : ""}`}>
        <header className="page-head minimal-head">
          <p className="eyebrow">{copy.generate}</p>
          <h1>{copy.birthTitle}</h1>
          <p>{copy.birthCopy}</p>
        </header>

        <section className="form-card compact-form">
          <label>{copy.calendar}<select value={form.calendarType} onChange={(event) => setForm((current) => ({ ...current, calendarType: event.target.value }))}><option>{copy.solar}</option><option>{copy.lunar}</option></select></label>
          <label>{copy.birthDate}<input type="date" value={form.birthDate} onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))} /></label>
          <label>{copy.birthTime}<select value={form.birthTime} onChange={(event) => setForm((current) => ({ ...current, birthTime: event.target.value }))}>{birthTimeRanges.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
          <label>{copy.gender}<select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}><option>{copy.female}</option><option>{copy.male}</option><option>{copy.emptyGender}</option></select></label>
          <button className="primary wide" onClick={startAnalyze}>{copy.analyzeCta}</button>
        </section>
      </section>

      <section className={`screen ${screen === "analyzing" ? "active" : ""}`}> 
        <div className="loading-card"><div className="spinner" /><h1>{copy.matching}</h1><p>{copy.matchingCopy}</p></div>
      </section>

      <section className={`screen ${screen === "recommend" ? "active" : ""}`}>
        <header className="page-head minimal-head">
          <p className="eyebrow">{copy.recommendKicker}</p>
          <h1>{copy.recommendTitle}</h1>
        </header>
        {analysis && primaryPreview ? <>
          <section className="featured-recommend">
            <article className={`feature-art ${primaryPreview.cls}`}>{primaryPreview.imageUrl ? <img src={primaryPreview.imageUrl} alt={primaryPreview.title} /> : null}</article>
            <div className="feature-copy">
              <ModelBadge />
              <h2>{primaryPreview.title}</h2>
              <p>{analysis.themeCopy}</p>
              <button className="primary wide" onClick={() => selectPreview(primaryPreview)}>{copy.useStyle}</button>
            </div>
          </section>

          <button className="why-toggle" onClick={() => setDetailOpen((open) => !open)}>{detailOpen ? copy.collapseReason : copy.expandReason}</button>
          {detailOpen ? <section className="reason-panel">
            <h3>{analysis.themeTitle}</h3>
            <p>{analysis.elementSummary}</p>
            <div className="pillar-grid"><span>{copy.year}: {analysis.baziDetail.year}</span><span>{copy.month}: {analysis.baziDetail.month}</span><span>{copy.day}: {analysis.baziDetail.day}</span><span>{copy.time}: {analysis.baziDetail.time}</span></div>
            <div className="element-bars">{elements.map((item) => <div className="element-row" key={item}><span>{item}</span><div><i style={{ width: `${Math.max(12, analysis.elementCounts[item] * 12)}%` }} /></div><b>{analysis.elementCounts[item]}</b></div>)}</div>
            <button className="text-btn" onClick={() => setThinkingOpen((open) => !open)}>{thinkingOpen ? copy.collapseThinking : copy.expandThinking}</button>
            {thinkingOpen ? <p className="thinking-text">{analysis.reasoning}</p> : null}
          </section> : null}

          {backupPreviews.length ? <section className="alternate-section"><div className="section-title slim"><h2>{copy.alternateTitle}</h2><span>{copy.swipeHint}</span></div><div className="alternate-list">{backupPreviews.map((item) => <article className={`alternate-card ${item.cls}`} key={item.title} role="button" tabIndex={0} onClick={() => selectPreview(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") selectPreview(item); }}><div className="alternate-art">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : null}</div><h3>{item.title}</h3><p>{item.visual}</p><span className="choose-pill">{copy.choose}</span></article>)}</div></section> : null}
        </> : null}
      </section>

      <section className={`screen ${screen === "result" ? "active" : ""}`}>
        <header className="page-head result-head">
          <p className="eyebrow">{copy.resultKicker}</p>
          <h1>{selectedTitle}</h1>
          <p>{copy.resultCopy}</p>
        </header>
        <section className="single-wallpaper-wrap">
          {generatedImageUrl ? (
            <img className="generated-wallpaper" src={generatedImageUrl} alt={`${selectedTitle}${copy.wallpaperSuffix}`} />
          ) : (
            <article className={`wallpaper single ${selectedPreview?.cls ?? "nature"}`}><span>{selectedTitle}</span></article>
          )}
        </section>
        {generationNote ? <p className="generation-note">{generationNote}</p> : null}
        <button className="primary wide" onClick={generateWallpaper} disabled={generating}>{generating ? copy.generating : quota > 0 ? copy.generateWallpaper : copy.quotaEmpty}</button>
        <div className="result-actions">{generatedImageUrl ? <button onClick={downloadWallpaper}>{copy.download}</button> : <button onClick={() => go("recommend")}>{copy.changeStyle}</button>}<button onClick={() => go("pay")}>{copy.buyQuota}</button></div>
      </section>

      <section className={`screen ${screen === "pay" ? "active" : ""}`}>
        <header className="page-head minimal-head"><p className="eyebrow">{copy.mine}</p><h1>{copy.payTitle}</h1><p>{copy.payCopy}</p></header>
        <section className="pay-grid"><button><b>1 \u5143</b><span>5 {copy.quotaUnit}</span></button><button><b>10 \u5143</b><span>50 {copy.quotaUnit}</span></button></section>
      </section>

      <nav className="bottom-nav">
        <button className={screen === "home" ? "active" : ""} onClick={() => go("home")}><span className="nav-icon home-icon" />{copy.todayWallpaper.slice(0, 2)}</button>
        <button className={screen === "birth" || screen === "recommend" || screen === "result" ? "active" : ""} onClick={() => go("birth")}><span className="nav-icon birth-icon" />{copy.generate}</button>
        <button className={screen === "pay" ? "active" : ""} onClick={() => go("pay")}><span className="nav-icon user-icon" />{copy.mine}</button>
      </nav>
    </main>
  );
}