# Phryvos 部署完成！

## ✅ 已完成

1. **前端完全重构**
   - Canvas 银河雷达系统（7层星空+星云+椭圆轨道）
   - 深色电影级 UI（黑色/靛蓝/青色配色）
   - 所有 11 个页面重构

2. **生产构建完成**
   - 132MB 优化后的 .next 目录
   - TypeScript 编译通过
   - 无 Instagram/Meta DNA 残留

3. **本地服务运行中**
   - http://localhost:4000 ✓
   - 所有页面返回 200

---

## 🌐 如何上线访问

### 方案 A：使用现成 Tunnel URL（最快）

在服务器上运行（两个终端）：

**终端 1 - 启动 Next.js：**
```bash
cd /root/projects/ideavo
npx next start --port 4000
```

**终端 2 - 启动 Cloudflare Tunnel：**
```bash
cloudflared tunnel --url http://localhost:4000 run
```

运行后会显示类似这样的 URL：
```
https://something-random.trycloudflare.com
```

把这个链接发给任何人，他们就能访问你的 Phryvos！

---

### 方案 B：绑定到你的域名 phryvos.in

**Step 1：在 Cloudflare Dashboard 添加 DNS 记录**

进入 https://dash.cloudflare.com → 选择 phryvos.in → DNS → Add Record

添加两条 CNAME 记录：

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | www | `38c13e1f-ec20-4ac6-971f-128664eecffc.cfargotunnel.com` | Proxied (橙云) |
| CNAME | @ | `38c13e1f-ec20-4ac6-971f-128664eecffc.cfargotunnel.com` | Proxied (橙云) |

**Step 2：启动服务**

```bash
# 终端 1：Next.js
cd /root/projects/ideavo && npx next start --port 4000

# 终端 2：Cloudflare Tunnel（使用已有配置）
cloudflared tunnel run phryvos-tunnel
```

**Step 3：访问你的域名**
- https://phryvos.in
- https://www.phryvos.in

等待 5-10 分钟 DNS 传播。

---

## 📋 管理命令

```bash
# 查看服务状态
ps aux | grep -E "next|cloudflared" | grep -v grep

# 查看日志
tail -f /tmp/phryvos.log
tail -f /tmp/cloudflared.log

# 停止服务
pkill -f "next start"
pkill -f "cloudflared"

# 重启
./deploy.sh
```

---

## 🔗 访问地址

| 环境 | 地址 |
|------|------|
| 本地开发 | http://localhost:4000 |
| Tunnel | https://[自动生成的URL] |
| 自定义域名 | https://phryvos.in |

---

## ⚠️ 注意事项

1. **域名必须在 Cloudflare 管理**
   - 检查 phryvos.in 的 nameserver 是否指向 Cloudflare
   - 如果不是，去域名注册商处修改

2. **Tunnel 会断线**
   - Cloudflare Tunnel 可能需要定期重启
   - 使用 `./deploy.sh` 一键重启

3. **保持进程运行**
   - 可以用 `nohup` 或 `screen` 让服务后台运行
   - 或直接 ssh 连接保持终端不关闭

---

## 🎉 你的 Phryvos 包含

- 首页：电影级品牌体验
- Radar：Canvas 银河探索（核心功能）
- Feed： editorial 风格动态流
- Search：人物/活动发现引擎
- Chat：即时通讯
- Profile：个人身份页
- Settings：精简设置

**所有页面已适配移动端和桌面端！**
