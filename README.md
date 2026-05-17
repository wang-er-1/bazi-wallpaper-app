# 今日壁纸

一个面向内测的 Next.js 工具站：用户填写出生信息后，系统排出八字和五行趋势，结合当前月份/节气推荐壁纸风格，并调用 `gpt-image-2` 生成 9:16 手机壁纸。

## 功能

- 出生信息填写：阳历/农历、日期、时间、性别
- 八字与五行分析：基于 `lunar-javascript`
- 风格推荐：根据五行和当前月份生成 3-5 个方向
- 图片生成：通过中转站调用 `gpt-image-2`
- 额度与价格原型：1 元/5 张、10 元/50 张
- 生成结果下载：一键下载壁纸

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 环境变量

本地使用 `.env.local`，线上在 Vercel Project Settings -> Environment Variables 中配置：

```bash
IMAGE_API_BASE_URL=https://m1.92k.store/v1
IMAGE_API_KEY=你的中转站密钥
IMAGE_MODEL=gpt-image-2
IMAGE_SIZE=1024x1792
```

注意：`.env` 和 `.env.local` 已被 `.gitignore` 忽略，不要上传密钥。

## 部署

推荐先用 Vercel 内测：

1. 推送代码到 GitHub。
2. Vercel 选择 Import Git Repository。
3. Framework Preset 选择 Next.js。
4. 添加上面的环境变量。
5. 部署完成后用 Vercel 提供的链接测试。
