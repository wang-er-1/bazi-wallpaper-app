/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

type Screen = "home" | "analyzing" | "recommend" | "result" | "mine";
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

type GenerationRecord = {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
  visual: string;
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

const initialFreeQuota = 1;
const inviteBonus = 5;
const recordsStorageKey = "bazi-wallpaper-records";
const quotaStorageKey = "bazi-wallpaper-quota";
const qqGroupUrl = "https://qun.qq.com/universal-share/share?ac=1&authKey=JyAmyZ%2FlTlFH0um%2FdEmKK%2FHLrMr0g9Jqt%2B0BxMG9ivf9XRPMCyslJLvG8sZ89j%2FS&busi_data=eyJncm91cENvZGUiOiI5Nzg5MDMyMjAiLCJ0b2tlbiI6IkFmd043K3ZReC9UZTRubTZZV2QzQmozQzI2V3p3SHJYRkIxOUFQbzBvVG9uUjNIRUxCZ2dQbnRLd1BWRHI4TmgiLCJ1aW4iOiIyNzk5Nzg3NTA1In0%3D&data=66EOgTHlP6zxDK2KfosW1K4c9EpRtIpfeAhPkUAKFUbLpvWs7tLXqtHhj7o-4HlVPJPzvfXurkl9mXfRt_7cRQ&svctype=4&tempid=h5_group_info";
const generationSteps = ["排盘复核", "命理取象", "提示词成稿", "gpt-image-2 生图"];
const analyzeSteps = ["读取出生信息", "换算四柱八字", "计算五行强弱", "匹配今日壁纸状态"];
const elements: ElementName[] = ["木", "火", "土", "金", "水"];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 90 }, (_, index) => currentYear - index);
const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function parseBirthDate(value: string) {
  const [year = "1996", month = "8", day = "18"] = value.split("-");
  return { year: Number(year), month: Number(month), day: Number(day) };
}

function formatBirthDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const birthTimeRanges = Array.from({ length: 24 }, (_, hour) => {
  const nextHour = (hour + 1) % 24;
  const value = `${String(hour).padStart(2, "0")}:30`;
  return { value, label: `${hour}-${nextHour}点` };
});

const bannerSlides = [
  { kicker: "今日壁纸", title: "测测你的今日壁纸", copy: "用出生信息和今天的气场，生成一张更顺眼、更顺手的手机壁纸。", tone: "sunrise" },
  { kicker: "轻开运", title: "换张壁纸，换个状态", copy: "清醒、回血、启动、稳住，今天先选一个状态。", tone: "aqua" },
  { kicker: "AI 生成", title: "不是图库随机", copy: "先看八字五行和当下月份，再交给 gpt-image-2 生成。", tone: "night" },
];

const moodMap: Record<string, { label: string; hook: string; className: string }> = {
  自然风景: { label: "慢慢回血", hook: "适合想放松、稳住、让眼睛休息一下", className: "style-nature" },
  抽象艺术: { label: "情绪开阔", hook: "适合想换个心情，不想画面太具象", className: "style-abstract" },
  治愈插画: { label: "轻松一点", hook: "适合想要温柔、可爱，但不要幼稚", className: "style-healing" },
  极简质感: { label: "降噪模式", hook: "适合不想太花、喜欢干净高级感", className: "style-minimal" },
  东方山水: { label: "稳住气场", hook: "适合想要留白、山势和一点靠山感", className: "style-oriental" },
  能量光感: { label: "开启动力", hook: "适合今天想启动、提气、往前走", className: "style-energy" },
};

function ModelBadge() {
  return <em className="model-badge"><img className="openai-icon" src="/openai-symbol.svg" alt="" aria-hidden="true" />gpt-image-2</em>;
}

function styleMeta(item: WallpaperPreview) {
  return moodMap[item.title] ?? { label: "今日适配", hook: "根据你的信息生成不同画面", className: "style-abstract" };
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [quota, setQuota] = useState(initialFreeQuota);
  const [records, setRecords] = useState<GenerationRecord[]>([]);
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<WallpaperPreview | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [generationNote, setGenerationNote] = useState("");
  const [generationStep, setGenerationStep] = useState(0);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [pendingPreview, setPendingPreview] = useState<WallpaperPreview | null>(null);
  const [form, setForm] = useState<AnalyzeRequest>({
    calendarType: "阳历",
    birthDate: "1996-08-18",
    birthTime: "08:30",
    gender: "女",
  });

  useEffect(() => {
    const savedQuota = window.localStorage.getItem(quotaStorageKey);
    const savedRecords = window.localStorage.getItem(recordsStorageKey);
    let parsedRecords: GenerationRecord[] = [];

    if (savedRecords) {
      try {
        const parsed = JSON.parse(savedRecords) as GenerationRecord[];
        parsedRecords = Array.isArray(parsed) ? parsed.slice(0, 20) : [];
        setRecords(parsedRecords);
      } catch {
        parsedRecords = [];
        setRecords([]);
      }
    }

    if (savedQuota !== null) {
      const storedQuota = Math.max(0, Number(savedQuota) || 0);
      const shouldFixOldFreeQuota = storedQuota === initialFreeQuota && parsedRecords.length >= initialFreeQuota;
      setQuota(shouldFixOldFreeQuota ? 0 : storedQuota);
      return;
    }

    setQuota(Math.max(0, initialFreeQuota - parsedRecords.length));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(quotaStorageKey, String(quota));
  }, [quota]);

  useEffect(() => {
    window.localStorage.setItem(recordsStorageKey, JSON.stringify(records.slice(0, 20)));
  }, [records]);

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => {
      setGenerationStep((current) => Math.min(current + 1, generationSteps.length - 1));
    }, 1700);
    return () => window.clearInterval(timer);
  }, [generating]);

  function updateBirthDate(part: "year" | "month" | "day", value: number) {
    setForm((current) => {
      const date = parseBirthDate(current.birthDate);
      const nextYear = part === "year" ? value : date.year;
      const nextMonth = part === "month" ? value : date.month;
      const maxDay = daysInMonth(nextYear, nextMonth);
      const nextDay = Math.min(part === "day" ? value : date.day, maxDay);
      return { ...current, birthDate: formatBirthDate(nextYear, nextMonth, nextDay) };
    });
  }

  async function startAnalyze() {
    setScreen("analyzing");
    setReasonOpen(false);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("分析失败");
      const data = (await response.json()) as AnalyzeResult;
      setAnalysis(data);
      setSelectedPreview(data.previews[0] ?? null);
      setGeneratedImageUrl("");
      setGenerationNote("");
      setScreen("recommend");
    } catch {
      setScreen("home");
      window.alert("分析暂时失败，请稍后再试。");
    }
  }

  function requestGenerate(item: WallpaperPreview) {
    if (generating) return;
    if (quota <= 0) {
      setPendingPreview(item);
      setInviteOpen(true);
      setInviteMessage("输入邀请码后可继续生成。");
      return;
    }
    void generateWallpaper(item);
  }

  async function requestGeneratedImage(item: WallpaperPreview) {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch("/api/generate-wallpaper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => null)) as { message?: string; detail?: string } | null;
          throw new Error([errorData?.message, errorData?.detail].filter(Boolean).join("\n") || "生成服务暂时不可用。");
        }

        return (await response.json()) as { imageUrl: string; message?: string; mode?: string };
      } catch (error) {
        lastError = error;
        if (attempt === 0) await new Promise((resolve) => window.setTimeout(resolve, 900));
      }
    }

    throw lastError instanceof Error ? lastError : new Error("网络不太稳定，图片生成请求没有成功。");
  }

  async function generateWallpaper(item: WallpaperPreview) {
    setSelectedPreview(item);
    setGeneratedImageUrl("");
    setGenerationNote("正在开画，先把你的八字取象转成画面关键词。");
    setGenerationStep(0);
    setGenerating(true);
    setScreen("result");

    try {
      const data = await requestGeneratedImage(item);
      const record: GenerationRecord = {
        id: `${Date.now()}-${item.title}`,
        title: item.title,
        imageUrl: data.imageUrl,
        createdAt: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
        visual: item.visual,
      };
      setGeneratedImageUrl(data.imageUrl);
      setGenerationNote(data.message || "壁纸已生成，已自动放进你的记录里。");
      setRecords((current) => [record, ...current].slice(0, 20));
      setQuota((current) => Math.max(0, current - 1));
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "";
      const friendlyMessage = rawMessage === "Load failed" || rawMessage === "Failed to fetch"
        ? "这次网络请求没有连上服务器，可能是手机网络或浏览器临时中断。你可以点重试，或换微信外部浏览器打开。"
        : rawMessage || "图片生成暂时失败，请稍后再试。";
      setGenerationNote(friendlyMessage);
      setGeneratedImageUrl("");
    } finally {
      setGenerating(false);
    }
  }

  async function redeemInvite() {
    const normalized = inviteCode.trim().toUpperCase().replace(/\s+/g, "");
    if (!normalized) {
      setInviteMessage("先输入邀请码。");
      return;
    }

    try {
      const response = await fetch("/api/invite/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
      });
      const data = (await response.json()) as { ok?: boolean; bonus?: number; message?: string };
      if (!response.ok || !data.ok) throw new Error(data.message || "邀请码兑换失败。");
      setQuota((current) => current + (data.bonus || inviteBonus));
      setInviteOpen(false);
      setInviteCode("");
      setInviteMessage(data.message || `已领取 ${data.bonus || inviteBonus} 次生成机会。`);
      if (pendingPreview) {
        const preview = pendingPreview;
        setPendingPreview(null);
        window.setTimeout(() => void generateWallpaper(preview), 120);
      }
    } catch (error) {
      setInviteMessage(error instanceof Error ? error.message : "邀请码兑换失败。");
    }
  }

  function openOriginalImage() {
    if (!generatedImageUrl) return;
    window.open(generatedImageUrl, "_blank", "noopener,noreferrer");
  }

  async function downloadWallpaper() {
    if (!generatedImageUrl) return;
    try {
      const response = await fetch(generatedImageUrl, { mode: "cors" });
      if (!response.ok) throw new Error("download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedPreview?.title ?? "今日"}-好运壁纸.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      openOriginalImage();
      window.alert("微信里可能不能直接下载，已尝试打开原图。你可以长按图片保存，或右上角用浏览器打开后下载。");
    }
  }

  const previews = analysis?.previews.slice(0, 3) ?? [];
  const selectedTitle = selectedPreview?.title ?? "今日壁纸";

  const birthDateParts = parseBirthDate(form.birthDate);
  const dayOptions = Array.from({ length: daysInMonth(birthDateParts.year, birthDateParts.month) }, (_, index) => index + 1);
  return (
    <main className="phone-app v4-app">
      <section className={`screen ${screen === "home" ? "active" : ""}`}>
        <header className="v4-topbar">
          <span>今日壁纸</span>
          <button onClick={() => setScreen("mine")}>剩 {quota} 次</button>
        </header>

        <section className="banner-carousel" aria-label="今日壁纸介绍">
          {bannerSlides.map((item) => (
            <article className={`banner-card ${item.tone}`} key={item.title}>
              <span>{item.kicker}</span>
              <h1>{item.title}</h1>
              <p>{item.copy}</p>
              <ModelBadge />
            </article>
          ))}
        </section>

        <section className="home-form-card">
          <div className="form-title"><span>填一下生日</span><b>生成前先分析，不会直接扣次数</b></div>
          <div className="quick-form-grid">
            <label>历法<select value={form.calendarType} onChange={(event) => setForm((current) => ({ ...current, calendarType: event.target.value }))}><option>阳历</option><option>农历</option></select></label>
            <label className="birthday-field">生日<div className="birthday-selects"><select value={birthDateParts.year} onChange={(event) => updateBirthDate("year", Number(event.target.value))}>{yearOptions.map((year) => <option value={year} key={year}>{year}年</option>)}</select><select value={birthDateParts.month} onChange={(event) => updateBirthDate("month", Number(event.target.value))}>{monthOptions.map((month) => <option value={month} key={month}>{month}月</option>)}</select><select value={birthDateParts.day} onChange={(event) => updateBirthDate("day", Number(event.target.value))}>{dayOptions.map((day) => <option value={day} key={day}>{day}日</option>)}</select></div></label>
            <label>时间<select value={form.birthTime} onChange={(event) => setForm((current) => ({ ...current, birthTime: event.target.value }))}>{birthTimeRanges.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
            <label>性别<select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}><option>女</option><option>男</option><option>不填写</option></select></label>
          </div>
          <button className="primary wide" onClick={startAnalyze}>生成壁纸</button>
        </section>
      </section>

      <section className={`screen ${screen === "analyzing" ? "active" : ""}`}>
        <div className="loading-card v4-loading"><div className="spinner" /><h1>正在匹配</h1><p>先看八字五行，再把今天适合你的颜色、意象和状态变成壁纸方案。</p><div className="generation-steps analyzing-steps">{analyzeSteps.map((step, index) => <span className={index <= analyzeStep ? "active" : ""} key={step}><i />{step}</span>)}</div><div className="process-brief"><b>正在读取</b><span>{form.calendarType} {form.birthDate} {form.birthTime}，先排盘，再给你推荐 3 个今天适合的壁纸状态。</span></div></div>
      </section>

      <section className={`screen ${screen === "recommend" ? "active" : ""}`}>
        <header className="page-head minimal-head">
          <p className="eyebrow">分析完成</p>
          <h1>选一个今天的状态</h1>
          <p>{analysis?.themeCopy}</p>
        </header>

        <section className="style-card-list">
          {previews.map((item) => {
            const meta = styleMeta(item);
            return (
              <article className={`style-card ${meta.className}`} key={item.title}>
                <div className="style-card-head"><span>{meta.label}</span><ModelBadge /></div>
                <h2>{item.title}</h2>
                <p>{meta.hook}</p>
                <div className="style-tags"><span>{item.visual.split("｜")[0]}</span><span>{item.visual.split("｜")[1] ?? "专属提示词"}</span></div>
                <button className="primary wide" onClick={() => requestGenerate(item)}>立即生成</button>
              </article>
            );
          })}
        </section>

        <button className="why-toggle" onClick={() => setReasonOpen((open) => !open)}>{reasonOpen ? "收起分析" : "看看为什么"}</button>
        {reasonOpen && analysis ? <section className="reason-panel">
          <h3>{analysis.themeTitle}</h3>
          <p>{analysis.elementSummary}</p>
          <div className="pillar-grid"><span>年柱: {analysis.baziDetail.year}</span><span>月柱: {analysis.baziDetail.month}</span><span>日柱: {analysis.baziDetail.day}</span><span>时柱: {analysis.baziDetail.time}</span></div>
          <div className="element-bars">{elements.map((item) => <div className="element-row" key={item}><span>{item}</span><div><i style={{ width: `${Math.max(12, analysis.elementCounts[item] * 12)}%` }} /></div><b>{analysis.elementCounts[item]}</b></div>)}</div>
          <p className="thinking-text">{analysis.reasoning}</p>
        </section> : null}
      </section>

      <section className={`screen ${screen === "result" ? "active" : ""}`}>
        <header className="page-head result-head">
          <p className="eyebrow">高清壁纸</p>
          <h1>{generating ? "正在生成" : selectedTitle}</h1>
          <p>{generating ? "别关页面，正在把你的今日状态画出来。" : "生成成功后会自动保存到我的记录。"}</p>
        </header>
        <section className="single-wallpaper-wrap">
          {generatedImageUrl ? <img className="generated-wallpaper" src={generatedImageUrl} alt={`${selectedTitle}壁纸`} /> : <div className="result-placeholder"><div className="spinner" /><span>{selectedTitle}</span></div>}
        </section>
        {generationNote ? <p className="generation-note">{generationNote}</p> : null}
        {generating ? <div className="generation-steps" aria-label="生成进度">{generationSteps.map((step, index) => <span className={index <= generationStep ? "active" : ""} key={step}><i />{step}</span>)}</div> : null}
        {generatedImageUrl ? <div className="result-actions v4-actions"><button className="primary" onClick={downloadWallpaper}>下载壁纸</button><button onClick={openOriginalImage}>打开原图</button><button onClick={() => setScreen("recommend")}>换一张</button><button onClick={() => setScreen("home")}>改信息</button></div> : selectedPreview && !generating ? <div className="result-actions v4-actions"><button className="primary" onClick={() => requestGenerate(selectedPreview)}>重试生成</button><button onClick={() => setScreen("recommend")}>换一张</button><button onClick={() => setScreen("home")}>改信息</button></div> : null}
      </section>

      <section className={`screen ${screen === "mine" ? "active" : ""}`}>
        <header className="page-head minimal-head"><p className="eyebrow">我的</p><h1>我的壁纸</h1><p>第一版先不开放付费。默认 1 次体验，邀请码可再领 5 次。</p></header>
        <section className="mine-card">
          <div><span>剩余生成次数</span><b>{quota}</b></div>
          <button onClick={() => setInviteOpen(true)}>兑换邀请码</button>
        </section>
        <button className="group-card" onClick={() => window.open(qqGroupUrl, "_blank", "noopener,noreferrer")}>加入交流群<span>反馈效果图、领内测码、一起调风格</span></button>
        <section className="record-section">
          <div className="section-title slim"><h2>生成记录</h2><span>{records.length ? "点开可查看" : "生成后自动保存"}</span></div>
          {records.length ? <div className="record-grid">{records.map((item) => <button className="record-card" key={item.id} onClick={() => { setGeneratedImageUrl(item.imageUrl); setSelectedPreview({ title: item.title, visual: item.visual, basis: "", cls: "", prompt: "" }); setGenerationNote("来自生成记录。"); setScreen("result"); }}><img src={item.imageUrl} alt={item.title} /><span>{item.title}</span><small>{item.createdAt}</small></button>)}</div> : <div className="empty-record">还没有记录。先生成一张今日壁纸试试。</div>}
        </section>
      </section>

      {inviteOpen ? <div className="invite-mask" role="dialog" aria-modal="true">
        <section className="invite-dialog">
          <button className="close-btn" onClick={() => { setInviteOpen(false); setPendingPreview(null); }}>×</button>
          <span>内测邀请码</span>
          <h2>领取生成次数</h2>
          <p>输入邀请码后增加 {inviteBonus} 次生成机会。没有邀请码也可以先看分析结果。</p>
          <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="例如 BZ001-XXXXXX" />
          {inviteMessage ? <small>{inviteMessage}</small> : null}
          <button className="primary wide" onClick={redeemInvite}>立即兑换</button>
        </section>
      </div> : null}

      <nav className="bottom-nav">
        <button className={screen === "home" ? "active" : ""} onClick={() => setScreen("home")}><span className="nav-icon home-icon" />首页</button>
        <button className={screen === "recommend" || screen === "result" ? "active" : ""} onClick={() => analysis ? setScreen("recommend") : setScreen("home")}><span className="nav-icon birth-icon" />生成</button>
        <button className={screen === "mine" ? "active" : ""} onClick={() => setScreen("mine")}><span className="nav-icon user-icon" />我的</button>
      </nav>
    </main>
  );
}







