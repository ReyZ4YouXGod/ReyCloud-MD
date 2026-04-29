require('./settings');

// ====== REQUIRE AREA & LIB START ======

const { 
    modul 
} = require('./lib/module');
const {
    runtime,
    formatp
} = require('./lib/function');

// ====== LIB END & MODULE START ======

const { 
    downloadContentFromMessage, 
    extractImageThumb 
} = require('socketon');
const util = require('util');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const chalk = require('chalk');

// ====== MODULE END & CONST START ======

const { 
    baileys, 
    os, 
    speed,
    moment,
    QuickChart
} = modul;
const { 
    BufferJSON, 
    WA_DEFAULT_EPHEMERAL, 
    generateWAMessageFromContent, 
    proto, 
    generateWAMessageContent, 
    generateWAMessage, 
    prepareWAMessageMedia, 
    areJidsSameUser, 
    getContentType, 
    generateForwardMessageContent 
} = baileys;
// ====== CONST END & REQUIRE AREA ======

// ==========================================================

module.exports = ReyCloud = async (ReyCloud, m, chatUpdate, store) => {
try {
    if (!m || !m.message) return;

    // --- MINI SERIALIZER (Penting untuk Base Polosan) ---
    m.chat = m.key.remoteJid || '';
    m.isGroup = m.chat.endsWith('@g.us');
    m.sender = m.key.fromMe ? (ReyCloud.user.id.split(':')[0]+'@s.whatsapp.net' || hydro.user.id) : (m.key.participant || m.key.remoteJid || '');
    m.pushName = m.pushName || "Misterius";
    m.mtype = Object.keys(m.message)[0];
    if (m.mtype === 'ephemeralMessage' || m.mtype === 'viewOnceMessage') {
        m.message = m.message[m.mtype].message;
        m.mtype = Object.keys(m.message)[0];
    }
    
    // ----------------------------------------------------
    
    const msgHelper = require('./lib/src/message')(ReyCloud, m, chatUpdate, store);
    const appenTextMessage = msgHelper.appenTextMessage;
    m = msgHelper.m;
    const reply = msgHelper.reply;
    
    // ----------------------------------------------------

    const type = m.mtype;
    
    let body = (m.mtype === 'conversation') ? m.message.conversation : 
         (m.mtype === 'imageMessage') ? m.message.imageMessage?.caption : 
         (m.mtype === 'videoMessage') ? m.message.videoMessage?.caption : 
         (m.mtype === 'extendedTextMessage') ? m.message.extendedTextMessage?.text : 
         (m.mtype === 'buttonsResponseMessage') ? m.message.buttonsResponseMessage?.selectedButtonId : 
         (m.mtype === 'listResponseMessage') ? m.message.listResponseMessage?.singleSelectReply?.selectedRowId : 
         (m.mtype === 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage?.selectedId : 
         (m.mtype === 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply?.selectedRowId || m.text) : 
         m.text || '';

    body = (typeof body === 'string') ? body : '';

    let budy = m.message.conversation || (m.message.extendedTextMessage && m.message.extendedTextMessage.text) || '';
    const prefix = global.prefix ? (Array.isArray(global.prefix) ? (global.prefix.slice().sort((a, b) => b.length - a.length).find(p => body.startsWith(p)) || global.prefix[0]) : global.prefix) : "";
    
    const isCmd = body.startsWith(prefix)
    const from = m.chat
    const command = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : ""
    const args = body.trim().split(/ +/).slice(1)
    
    const pushname = m.pushName
    const botNumber = await ReyCloud.decodeJid(ReyCloud.user.id)
    const Dev = [...(global.owner || []), global.ownernomer, global.botnumber]
        .map(v => v ? v.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : '')
        .includes(m.sender);
    
    const rawId = String(m.key.id || '');
    const baseId = rawId.split('-')[0];

    let isOtherBot = false;

    if (baseId.startsWith('BAE5')) isOtherBot = true;
    if (baseId.match(/[^0-9A-F]/gi)) isOtherBot = true;
    if (baseId.length !== 32 && !baseId.startsWith('3EB0') && !baseId.startsWith('3A')) isOtherBot = true;

    if (isOtherBot && !Dev && !m.key.fromMe) return;
    
    const text = args.join(" ")
    const q = text
    const quoted = m.quoted ? m.quoted : m
    const mime = (quoted.msg || quoted).mimetype || ''
    
    // Media Checks
    const isMedia = /image|video|sticker|audio/.test(mime)
    const isImage = (type == 'imageMessage')
    const isVideo = (type == 'videoMessage')
    const isAudio = (type == 'audioMessage')
    const isSticker = (type == 'stickerMessage')

    store.groupMetadata = store.groupMetadata || {};
    const groupMetadata = m.isGroup ? store.groupMetadata[m.chat] || (store.groupMetadata[m.chat] = await ReyCloud.groupMetadata(m.chat).catch(e => {})) : '';
    const groupName = m.isGroup ? groupMetadata.subject : ''
    const participants = m.isGroup ? await groupMetadata.participants : ''

    if (m.isGroup && m.sender.endsWith("@lid")) {
        m.sender = participants.find(p => p.lid === m.sender)?.jid || m.sender;
    }

    const groupAdmins = m.isGroup ? participants.filter((v) => v.admin !== null).map((i) => i.jid || i.id) : [];
    const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
    const isGroupAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
    
    const sender = m.sender
    const senderNumber = sender ? sender.split('@')[0] : ''

    const mentionUser = [...new Set([...(m.mentionedJid || []), ...(m.quoted ? [m.quoted.sender] : [])])]
    const mentionByTag = type == 'extendedTextMessage' && m.message.extendedTextMessage.contextInfo != null ? m.message.extendedTextMessage.contextInfo.mentionedJid : []
    const mentionByReply = type == 'extendedTextMessage' && m.message.extendedTextMessage.contextInfo != null ? m.message.extendedTextMessage.contextInfo.participant || '' : ''
    
    const isChannel = m.chat.endsWith('@newsletter');
    
    if (m.message && !m.key.fromMe) { // Hanya log pesan masuk (bukan balasan bot)
        const timeLog = chalk.green(new Date().toISOString().slice(0, 19).replace('T', ' '));
        const msgLog = chalk.blue(budy || m.mtype);

        if (isChannel) {
            console.log(`
┌───────── [ CHANNEL CHAT LOG ] ─────────┐
│ 🕒 Time      : ${timeLog}
│ 📝 Message   : ${msgLog}
│ 📢 Channel   : ${chalk.magenta(pushname || 'Saluran')} (${chalk.cyan(m.chat)})
└────────────────────────────────────────┘
            `);
        } else if (m.isGroup) {
            console.log(`
┌────────── [ GROUP CHAT LOG ] ──────────┐
│ 🕒 Time      : ${timeLog}
│ 📝 Message   : ${msgLog}
│ 👤 Sender    : ${chalk.magenta(pushname)} (${chalk.cyan(m.sender)})
│ 🏠 Group     : ${chalk.yellow(groupName)} (${chalk.cyan(m.chat)})
└────────────────────────────────────────┘
            `);
        } else {
            console.log(`
┌───────── [ PRIVATE CHAT LOG ] ─────────┐
│ 🕒 Time      : ${timeLog}
│ 📝 Message   : ${msgLog}
│ 👤 Sender    : ${chalk.magenta(pushname)} (${chalk.cyan(m.sender)})
└────────────────────────────────────────┘
            `);
        }
    }
    // ==============================================
    
switch (command) {
case 'menu':
case 'help': {
    const jid = m.chat;
    const name = m.pushName || 'Gan';
    const menuVideo = 'https://g.top4top.io/m_3672d3e6p5.mp4'; 
    const menuAudio = './media/GaramChina.mp3'; 
    const runtime = (seconds) => {
  seconds = Number(seconds)
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor(seconds % (3600 * 24) / 3600)
  const m = Math.floor(seconds % 3600 / 60)
  const s = Math.floor(seconds % 60)
  return `${d}d ${h}h ${m}m ${s}s`
}

const mode = ReyCloud.public ? 'Public' : 'Self'

const now = new Date()
const hari = now.toLocaleDateString('id-ID', { weekday: 'long' })
const tanggal = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

const menu = `
┏━━━⚡ *REYCLOUD MD BOT* ⚡━━━┓
┃
┃ 👋 Halo *${name}*!
┃   
┃ Versi : 2.0
┃ Developer : ReyCloudDev
┃
┃ Status Bot : ${mode}
┃ Runtime : ${runtime(process.uptime())}
┃ Hari    : ${hari}
┃ Tanggal : ${tanggal}
┃
┣━━━🤖 *BOT INFO* ━━━┓
┃ 📱 Device : Connected
┃ ⚡ Speed  : Stabil
┃
┃ *Silahkan Tekan Button Untuk Lihat Menu
┗━━━━━━━━━━━━━━━━━━━━━┛

*ReyCloudDev © 2026* | _Multi Device System_
`.trim();
    
let buttons = [
        { buttonId: ".buysc", buttonText: { displayText: "BuyScript" } },    
        { buttonId: ".owner", buttonText: { displayText: "Creator" } }            
    ];

    let buttonMessage = {
        image: { url: "https://b.top4top.io/p_3759s0zuk0"},        
        caption: menu,
        contextInfo: {
            externalAdReply: {
                showAdAttribution: false,
                title: `Asisten ReyCloud`,
                body: `PT LEGION TECKNOLOGI`,
                thumbnailUrl: `https://b.top4top.io/p_3759s0zuk0.jpg`,
                sourceUrl: ` `,
                mediaType: 1,
                renderLargerThumbnail: false, 
            }
        },
        footer: "ReyCloudDev",
        buttons: buttons,
        viewOnce: true,
        headerType: 6
    };

    const flowActions = {
        buttonId: 'action',
        buttonText: { displayText: 'This Button List' },
        type: 4,
        nativeFlowInfo: {
            name: 'single_select',
            paramsJson: JSON.stringify({
                title: "Show All Fitur",
                sections: [
                    {
                        title: "ReyCloud Projeck",
                        highlight_label: "Populer ♔",
                        rows: [
                            { title: "BugMenu", description: "Menampilkan All Fitur Khusus Bug", id: `..bugmenu` },                       
                            { title: "OwnerMenu", description: "Menampilkan Fitur Khusus Owner", id: `.ownmenu` },
                            { title: "ToolsMenu", description: "Menampilkan Fitur Tools", id: `.tools` }, 
                            { title: "Partner Anthares", description: "Menampilkan Name Partner Anthares", id: `.ptanthares` }                      
                        ]
                    }
                ]
            })
        },
        viewOnce: true
    };

    // Push the new button properly
    buttonMessage.buttons.push(flowActions);

    await ReyCloud.sendMessage(m.chat, buttonMessage, { quoted: fquoted.channel });  
          ReyCloud.sendMessage(m.chat, {audio: fs.readFileSync('./Cinta.mp3'), mimetype:'audio/mpeg', ptt: true}, {quoted: m})
}
break








case 'ping':
case 'statusbot':
case 'botstatus':
case 'os': {

        let timestamp = m.messageTimestamp ? (typeof m.messageTimestamp === 'number' ? m.messageTimestamp : m.messageTimestamp.low) : (Date.now() / 1000);
        let now = Date.now();
        let latensi = now - (timestamp * 1000);

        const startProcess = performance.now();

        let osName = 'Unknown OS';
        try {
            if (process.platform === 'linux' && fs.existsSync('/etc/os-release')) {
                const osInfo = fs.readFileSync('/etc/os-release', 'utf8');
                const nameMatch = osInfo.match(/^NAME="?(.+?)"?$/m);
                const verMatch = osInfo.match(/^VERSION="?(.+?)"?$/m);
                const name = nameMatch ? nameMatch[1].replace(/"/g, '') : '';
                const version = verMatch ? verMatch[1].replace(/"/g, '') : '';
                osName = `${name} ${version}`.trim();
            } else if (process.platform === 'win32') osName = 'Windows';
            else if (process.platform === 'darwin') osName = 'macOS';
            else if (process.platform === 'android') osName = 'Android (Termux)';
            else osName = os.type();
        } catch {
            osName = os.type();
        }

        const runtimeFormat = (seconds) => {
            const d = Math.floor(seconds / (3600 * 24));
            const h = Math.floor((seconds % (3600 * 24)) / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return `*${d}* ☀️ Hari\n│ *${h}* 🕐 Jam\n│ *${m}* ⏰ Menit\n│ *${s}* ⏱️ Detik`;
        };

        const formatp = (bytes) => `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;

        const getCpuUsage = async (delay = 100) => {
            const start = os.cpus();
            await new Promise(r => setTimeout(r, delay));
            const end = os.cpus();
            let idleDiff = 0, totalDiff = 0;

            for (let i = 0; i < start.length; i++) {
                const s = start[i].times;
                const e = end[i].times;
                const idle = e.idle - s.idle;
                const total = Object.keys(s).reduce((a, t) => a + (e[t] - s[t]), 0);
                idleDiff += idle;
                totalDiff += total;
            }
            return 100 - Math.round((idleDiff / totalDiff) * 100);
        };

        const cpuUsagePercent = await getCpuUsage();

        const cpus = os.cpus();
        const avgSpeed = cpus.reduce((a, c) => a + c.speed, 0) / cpus.length;
        const cpuModel = cpus[0]?.model?.trim() || 'Unknown CPU';
        const cpuCore = cpus.length;

        const mem = os.totalmem();
        const free = os.freemem();

        let swapTotal = 0, swapFree = 0;
        try {
            if (fs.existsSync('/proc/meminfo')) {
                const info = fs.readFileSync('/proc/meminfo', 'utf8');
                const swapTotalMatch = info.match(/^SwapTotal:\s+(\d+)/m);
                const swapFreeMatch = info.match(/^SwapFree:\s+(\d+)/m);
                swapTotal = swapTotalMatch ? parseInt(swapTotalMatch[1]) * 1024 : 0;
                swapFree = swapFreeMatch ? parseInt(swapFreeMatch[1]) * 1024 : 0;
            }
        } catch {}

        const totalMemAll = mem + swapTotal;
        const usedMemAll = (mem - free) + (swapTotal - swapFree);
        const percentUsed = totalMemAll > 0 ? (usedMemAll / totalMemAll) * 100 : 0;

        const runtimeText = runtimeFormat(process.uptime());
        const waktu = moment().tz("Asia/Jakarta").format('HH:mm:ss');
        const tanggal = moment().tz("Asia/Jakarta").locale("id").format('dddd, D MMMM YYYY');

        const endProcess = performance.now();
        const responInSeconds = ((endProcess - startProcess) / 1000).toFixed(4);

        const val = parseFloat(responInSeconds);
        let p = 0;
        
        if (val >= 1.0000) p = 100;
        else if (val <= 0.0001) p = 0;
        else if (val <= 0.0010) p = 0 + ((val - 0.0001) / (0.0010 - 0.0001)) * 20;
        else if (val <= 0.0100) p = 20 + ((val - 0.0010) / (0.0100 - 0.0010)) * 20;
        else if (val <= 0.1000) p = 40 + ((val - 0.0100) / (0.1000 - 0.0100)) * 20;
        else if (val <= 0.6000) p = 60 + ((val - 0.1000) / (0.6000 - 0.1000)) * 20;
        else p = 80 + ((val - 0.6000) / (1.0000 - 0.6000)) * 20;

        const chart = new QuickChart();
        chart.setVersion('3');
        chart.setWidth(500);
        chart.setHeight(300);
        chart.setConfig({
            type: 'bar',
            data: {
                labels: [''],
                datasets: [
                    { label: 'Safe', data: [20], backgroundColor: '#32CD32', barPercentage: 1, categoryPercentage: 1 },
                    { label: 'Low Risk', data: [20], backgroundColor: '#ADFF2F', barPercentage: 1, categoryPercentage: 1 },
                    { label: 'Warning', data: [20], backgroundColor: '#FFFF00', barPercentage: 1, categoryPercentage: 1 },
                    { label: 'High Risk', data: [20], backgroundColor: '#FFA500', barPercentage: 1, categoryPercentage: 1 },
                    { label: 'Critical', data: [20], backgroundColor: '#FF0000', barPercentage: 1, categoryPercentage: 1 },
                ],
            },
            options: {
                indexAxis: 'y',
                layout: { padding: { top: 60, bottom: 20, left: 20, right: 20 } },
                scales: {
                    x: {
                        stacked: true, min: 0, max: 100,
                        ticks: {
                            display: true, color: '#999', maxRotation: 45, minRotation: 45,
                            font: { size: 10 },
                            callback: (val) => {
                                const l = {0:'0.0001', 10:'0.0003', 20:'0.0010', 30:'0.0030', 40:'0.0100', 50:'0.0300', 60:'0.1000', 70:'0.3000', 80:'0.6000', 90:'0.8000', 100:'1.0000'};
                                return l[val] || '';
                            }
                        },
                        grid: { display: false }
                    },
                    y: { display: false, stacked: true }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    annotation: {
                        clip: false,
                        annotations: {
                            text: {
                                type: 'label',
                                xValue: p, yValue: 0, yAdjust: -125,
                                content: [`Respond: ${responInSeconds}s`], 
                                color: 'black', font: { size: 14, weight: 'bold' },
                                position: 'center', backgroundColor: 'transparent'
                            },
                            panah: {
                                type: 'point', xValue: p, yValue: 0, yAdjust: -100,
                                pointStyle: 'triangle', rotation: 180, radius: 8,
                                backgroundColor: 'black', borderColor: 'black'
                            },
                            garis: {
                                type: 'line', xMin: p, xMax: p, yMin: -0.5, yMax: 0.5,
                                borderColor: 'black', borderWidth: 2, borderDash: [6, 4]
                            }
                        }
                    }
                }
            }
        });
        
        let pingIcon;
        if (latensi < 100) pingIcon = "🟢";
        else if (latensi < 300) pingIcon = "🔵";
        else if (latensi < 600) pingIcon = "🟡";
        else if (latensi < 1000) pingIcon = "🟠";
        else pingIcon = "🔴";

        const response = `
╭───⏱️ *[ STATUS BOT ]* ⏱️
│
├ 💠 *Ping:* ${pingIcon} ${latensi.toFixed(0)} ms
├ 💠 *Respon:* ${responInSeconds} detik
│
├ 📈 *Uptime:*
│  ${runtimeText}
│
├ 🖥️ *Server Info:*
│  🔵 Platform : ${os.platform()}
│  💻 OS        : ${osName}
│  🧿 Hostname : ${os.hostname()}
│  🌎 Zona      : ${Intl.DateTimeFormat().resolvedOptions().timeZone}
│  🧠 CPU       : ${cpuModel}
│  🔩 Core      : ${cpuCore} Core
│  ⚡ Speed     : ${avgSpeed.toFixed(2)} MHz
│
├ 📊 *RAM Usage:*
│  ${formatp(usedMemAll)} / ${formatp(totalMemAll)} (${percentUsed.toFixed(1)}%)
│
├ ⚡ *CPU Usage:*
│  ${cpuUsagePercent.toFixed(1)}% dari ${cpuCore} Core
│
├ 🗓️ *Tanggal:* ${tanggal}
├ 🕒 *Waktu:* ${waktu} WIB
╰─────────────────────
`.trim();

        ReyCloud.sendMessage(m.chat, {
            text: response,
            contextInfo: {
                externalAdReply: {  
                    title: "🏓 Status bot online >.<",
                    body: global.botname, 
                    thumbnailUrl: chart.getUrl(),
                    sourceUrl: "https://store.hydrohost.web.id",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });
    }
    break;

case 'sticker':
case 'stiker': 
case 's':
case 'stickergif': 
case 'sgif': 
case 'swm': 
case 'take': {
    
        const isQuotedMedia = type === 'extendedTextMessage' && m.message.extendedTextMessage.contextInfo?.quotedMessage;
        const targetMessage = isQuotedMedia ? m.message.extendedTextMessage.contextInfo.quotedMessage : m.message;
        const targetType = Object.keys(targetMessage)[0];
        
        if (!['imageMessage', 'videoMessage', 'stickerMessage'].includes(targetType)) {
            return reply(`Kirim atau balas gambar/video/gif dengan caption ${prefix + command}\nDurasi maksimal 10 detik!`);
        }

        const mediaObj = targetMessage[targetType];
        
        if (targetType === 'videoMessage' && mediaObj.seconds > 11) {
            return reply('Maksimal durasi video adalah 10 detik ya kak!');
        }

        try {
            const stream = await downloadContentFromMessage(mediaObj, targetType.replace('Message', ''));
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            let teks1 = text.split('|')[0] || global.packname;
            let teks2 = text.split('|')[1] || global.author;

            await ReyCloud.sendAsSticker(m.chat, buffer, m, { packname: teks1, author: teks2 });
            
        } catch (err) {
            console.log(err);
            reply(global.mess.error.fitur);
        }
    }
    break;

// ============ BATAS CASE ============
default:
    if (budy.startsWith('<')) {
        if (!Dev) return
        try {
            return reply(JSON.stringify(eval(`${args.join(' ')}`),null,'\t'))
        } catch (e) {
            reply(e)
        }
    }

    if (budy.startsWith('$')) {
        if (!Dev) return reply("Hanya untuk Owner!")
        exec(budy.slice(2), (err, stdout) => {
            if(err) return ReyCloud.sendMessage(m.chat, {text: err.toString()}, {quoted: m})
            if (stdout) return ReyCloud.sendMessage(m.chat, {text: util.format(stdout)}, {quoted: m})
        })
    }

    if (budy.startsWith('vv')) {
        if (!Dev) return
        try {
            let evaled = await eval(budy.slice(2))
            if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
            await reply(evaled)
        } catch (err) {
            reply(String(err))
        }
    }

    if (budy.startsWith(">")) {
        if (!Dev) return
        try {
            let evaled = await eval(budy.slice(1)) 
            if (typeof evaled !== 'string') evaled = util.inspect(evaled)
            ReyCloud.sendMessage(m.chat, {text: util.format(evaled)}, {quoted: m})
        } catch (e) {
            ReyCloud.sendMessage(m.chat, {text: util.format(e)}, {quoted: m})
        }
    }

} // End Switch

} catch (err) {
    console.log(util.format(err))
}
}

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err)
})

function autoClearSession() {
    const sessionDir = './cloudsesi';
    const tempDir = './temp'; 
    const clearInterval = 4 * 60 * 60 * 1000; // 4 Jam
    
    setInterval(async () => {
        try {
            if (fs.existsSync(sessionDir)) {
                const files = fs.readdirSync(sessionDir);
                const filteredFiles = files.filter(file => 
                    file.startsWith('pre-key') ||
                    file.startsWith('sender-key') ||
                    file.startsWith('session-') ||
                    file.startsWith('app-state')
                );

                if (filteredFiles.length > 0) {
                    console.log(chalk.yellow.bold(`📂 [AUTO CLEAN] Starting session cleanup...`));
                    filteredFiles.forEach(file => {
                        fs.unlinkSync(path.join(sessionDir, file));
                    });
                    console.log(chalk.green.bold(`🗃️ [AUTO CLEAN] Successfully removed ${filteredFiles.length} session files!`));
                }
            }

            if (fs.existsSync(tempDir)) {
                const tempFiles = fs.readdirSync(tempDir);
                if (tempFiles.length > 0) {
                    tempFiles.forEach(file => {
                        fs.unlinkSync(path.join(tempDir, file));
                    });
                    console.log(chalk.cyan.bold(`🗑️ [TEMP CLEAN] Successfully deleted ${tempFiles.length} files from temp!`));
                }
            }
        } catch (error) {
            console.error(chalk.red.bold(`📑 [AUTO CLEAN ERROR]`), error);
        }
    }, clearInterval);
}

autoClearSession();

// ======================== Auto Reload File ===================== \\
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`[ UPDATE ] '${__filename}'`))
    delete require.cache[file]
    require(file)
})
