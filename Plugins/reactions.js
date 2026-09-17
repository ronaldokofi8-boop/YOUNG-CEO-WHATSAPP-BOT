import fs from "fs";
import path from "path";

import {
  banUser,
  checkBan,
  unbanUser,
  addMod,
  checkMod,
  delMod,
  setChar,
  getChar,
  activateChatBot,
  checkPmChatbot,
  deactivateChatBot,
  setBotMode,
  getBotMode,
  banGroup,
  checkBanGroup,
  unbanGroup,
} from "../System/MongoDB/MongoDb_Core.js";

import {
  userData,
  groupData,
} from "../System/MongoDB/MongoDB_Schema.js";

const mergedCommands = [
  "addmod",
  "setmod",
  "delmod",
  "removemod",
  "modlist",
  "mods",
  "owners",
  "owner",
  "ban",
  "banuser",
  "unban",
  "unbanuser",
  "banlist",
  "listbans",
  "setchar",
  "dmchatbot",
  "pmchatbot",
  "bangroup",
  "bangc",
  "unbangroup",
  "unbangc",
  "setbotmode",
  "mode",
  "getcmd",
  "getplugin",
  "cmdfile",
  "charlist",
  "characters",
];

function getTargetUser(m, mentionByTag = []) {
  // Safely get a quoted user's sender
  if (m?.quoted?.sender) {
    return m.quoted.sender;
  }

  // Safely get a mentioned user
  if (
    Array.isArray(mentionByTag) &&
    mentionByTag.length > 0 &&
    mentionByTag[0]
  ) {
    return mentionByTag[0];
  }

  // Safely get participant from contextInfo.
  //
  // IMPORTANT:
  // m.msg.contextInfo may not exist on normal messages.
  const participant =
    m?.msg?.contextInfo?.participant ||
    m?.message?.contextInfo?.participant ||
    null;

  return participant;
}

function getNumber(userId) {
  if (!userId || typeof userId !== "string") {
    return "";
  }

  return userId.split("@")[0];
}

export default {
  name: "moderators",

  alias: [...mergedCommands],

  uniquecommands: [
    "addmod",
    "delmod",
    "mods",
    "ban",
    "unban",
    "banlist",
    "setchar",
    "pmchatbot",
    "bangroup",
    "unbangroup",
    "mode",
    "getcmd",
    "charlist",
  ],

  description: "All Moderator/Owner Commands",

  start: async (
    Atlas,
    m,
    {
      inputCMD,
      text,
      mods,
      isCreator,
      banData,
      prefix,
      db,
      isintegrated,
      doReact,
      args,
      itsMe,
      participants,
      metadata,
      mentionByTag,
      mime,
      isMedia,
      quoted,
      botNumber,
      isBotAdmin,
      groupAdmin,
      isAdmin,
      pushName,
      groupName,
    },
  ) => {
    try {
      const isUsermod = await checkMod(m.sender);

      if (
        !isCreator &&
        !isintegrated() &&
        !isUsermod &&
        inputCMD !== "charlist" &&
        inputCMD !== "characters" &&
        inputCMD !== "mods" &&
        inputCMD !== "modlist" &&
        inputCMD !== "owners" &&
        inputCMD !== "owner"
      ) {
        await doReact("❌");
        return await m.reply(
          "Sorry, only my *Mods* can use this command!",
        );
      }

      switch (inputCMD) {
        // ============================================================
        // ADD MOD
        // ============================================================

        case "addmod":
        case "setmod": {
          if (!text && !m.quoted && !mentionByTag?.length) {
            await doReact("❌");
            return await m.reply(
              "Please tag a user to make *mod*!",
            );
          }

          const userId = getTargetUser(m, mentionByTag);

          if (!userId) {
            await doReact("❌");
            return await m.reply(
              "Please mention or quote a valid user.",
            );
          }

          try {
            const isTargetMod = await checkMod(userId);

            if (
              !isCreator &&
              !isintegrated() &&
              isTargetMod
            ) {
              await doReact("❌");
              return await m.reply(
                "Sorry, only my *Owner* can use this command! *Added Mods* does not have this permission.",
              );
            }

            if (isTargetMod) {
              await doReact("✅");

              return await Atlas.sendMessage(
                m.from,
                {
                  text: `@${getNumber(userId)} is already registered as a mod`,
                  mentions: [userId],
                },
                { quoted: m },
              );
            }

            await addMod(userId);

            await doReact("✅");

            await Atlas.sendMessage(
              m.from,
              {
                text: `@${getNumber(userId)} is successfully registered to mods`,
                mentions: [userId],
              },
              { quoted: m },
            );
          } catch (err) {
            console.error(
              "[EXCEPTION] addmod error:",
              err,
            );

            await doReact("❌");

            return await m.reply(
              `An error occurred: ${err?.message || err}`,
            );
          }

          break;
        }

        // ============================================================
        // DELETE MOD
        // ============================================================

        case "delmod":
        case "removemod": {
          if (!text && !m.quoted && !mentionByTag?.length) {
            await doReact("❌");
            return await m.reply(
              "Please tag a user to remove from *mod*!",
            );
          }

          const userId = getTargetUser(m, mentionByTag);

          if (!userId) {
            await doReact("❌");
            return await m.reply(
              "Please mention or quote a valid user.",
            );
          }

          try {
            const isTargetMod = await checkMod(userId);

            if (
              !isCreator &&
              !isintegrated() &&
              isTargetMod
            ) {
              await doReact("❌");

              return await m.reply(
                "Sorry, only my *Owner* can use this command! *Added Mods* does not have this permission.",
              );
            }

            if (!isTargetMod) {
              await doReact("✅");

              return await Atlas.sendMessage(
                m.from,
                {
                  text: `@${getNumber(userId)} is not registered as a mod!`,
                  mentions: [userId],
                },
                { quoted: m },
              );
            }

            await delMod(userId);

            await doReact("✅");

            await Atlas.sendMessage(
              m.from,
              {
                text: `@${getNumber(userId)} is successfully removed from mods`,
                mentions: [userId],
              },
              { quoted: m },
            );
          } catch (err) {
            console.error(
              "[EXCEPTION] delmod error:",
              err,
            );

            await doReact("❌");

            return await m.reply(
              `An error occurred: ${err?.message || err}`,
            );
          }

          break;
        }

        // ============================================================
        // MOD LIST
        // ============================================================

        case "modlist":
        case "owners":
        case "owner":
        case "mods": {
          try {
            await doReact("✅");

            const modlist = await userData.find({
              addedMods: "true",
            });

            let modlistString = "";

            const ownerList = Array.isArray(global.owner)
              ? global.owner
              : [];

            modlist.forEach((mod) => {
              if (mod?.id) {
                modlistString += `\n@${getNumber(mod.id)}\n`;
              }
            });

            const mention = modlist
              .filter((mod) => mod?.id)
              .map((mod) => mod.id);

            const xy = modlist
              .filter((mod) => mod?.id)
              .map((mod) => mod.id);

            const yz = ownerList.map(
              (owner) => `${owner}@s.whatsapp.net`,
            );

            const xyz = xy.concat(yz);

            let textM = `🧣 *${typeof botName !== "undefined" ? botName : "Atlas MD"} Mods* 🧣\n\n`;

            if (ownerList.length === 0 && modlist.length === 0) {
              textM = "*No Mods Added!*";
            } else {
              textM += `\n〽️ *Owners* 〽️\n`;

              for (let i = 0; i < ownerList.length; i++) {
                textM += `\n  @${ownerList[i]}\n`;
              }

              if (modlistString !== "") {
                textM += `\n🧩 *Added Mods* 🧩\n`;

                for (let i = 0; i < modlist.length; i++) {
                  if (modlist[i]?.id) {
                    textM += `\n  @${getNumber(
                      modlist[i].id,
                    )}\n`;
                  }
                }
              }

              if (
                modlistString !== "" ||
                ownerList.length !== 0
              ) {
                textM += `\n\n📛 *Don't Spam them to avoid Blocking!*\n\n🎀 For any help, type *${prefix}support* and ask in group.\n\n*💫 Thanks for using ${typeof botName !== "undefined" ? botName : "Atlas MD"}. 💫*\n`;
              }
            }

            await Atlas.sendMessage(
              m.from,
              {
                video:
                  typeof botVideo !== "undefined"
                    ? { url: botVideo }
                    : undefined,
                gifPlayback: true,
                caption: textM,
                mentions: xyz,
              },
              { quoted: m },
            );
          } catch (err) {
            console.error(
              "[EXCEPTION] modlist error:",
              err,
            );

            await doReact("❌");

            return await Atlas.sendMessage(
              m.from,
              {
                text:
                  "An internal error occurred while fetching the mod list.",
              },
              { quoted: m },
            );
          }

          break;
        }

        // ============================================================
        // BAN USER
        // ============================================================

        case "ban":
        case "banuser": {
          if (!text && !m.quoted && !mentionByTag?.length) {
            await doReact("❌");

            return await Atlas.sendMessage(
              m.from,
              {
                text: "Please tag or quote a user to *Ban*!",
              },
              { quoted: m },
            );
          }

          const mentionedUser = getTargetUser(
            m,
            mentionByTag,
          );

          const senderIsMod = await checkMod(m.sender);

          if (
            !senderIsMod &&
            !isCreator &&
            !isintegrated()
          ) {
            await doReact("❌");

            return await Atlas.sendMessage(
              m.from,
              {
                text: "Sorry, only *Owners* and *Mods* can use this command!",
              },
              { quoted: m },
            );
          }

          // IMPORTANT:
          // Never access m.msg.contextInfo.participant
          // directly. It may not exist.
          const userId = mentionedUser;

          if (!userId) {
            await doReact("❌");

            return await m.reply(
              "Please tag or quote a valid user to ban.",
            );
          }

          try {
            const checkBanStatus = await checkBan(userId);

            const checkUserModStatus =
              await checkMod(userId);

            const userNum = getNumber(userId);

            const globalOwner = Array.isArray(global.owner)
              ? global.owner
              : [];

            if (
              checkUserModStatus === true ||
              globalOwner.includes(userNum)
            ) {
              await doReact("❌");

              return await m.reply(
                "Sorry, I can't ban an *Owner* or *Mod*!",
              );
            }

            if (
              userId === botNumber ||
              userNum === getNumber(botNumber)
            ) {
              await doReact("❌");

              return await m.reply(
                "I cannot ban myself!",
              );
            }

            if (checkBanStatus) {
              await doReact("✅");

              return await Atlas.sendMessage(
                m.from,
                {
                  text: `@${userNum} is already *Banned*!`,
                  mentions: [userId],
                },
                { quoted: m },
              );
            }

            await banUser(userId);

            await doReact("✅");

            await Atlas.sendMessage(
              m.from,
              {
                text: `@${userNum} has been *Banned* Successfully by *${pushName}*`,
                mentions: [userId],
              },
              { quoted: m },
            );
          } catch (err) {
            console.error(
              "[EXCEPTION] ban error:",
              err,
            );

            await doReact("❌");

            return await m.reply(
              `Failed to ban user: ${err?.message || err}`,
            );
          }

          break;
        }

        // ============================================================
        // UNBAN USER
        // ============================================================

        case "unban":
        case "unbanuser": {
          if (!text && !m.quoted && !mentionByTag?.length) {
            await doReact("❌");

            return await m.reply(
              "Please tag or quote a user to *Un-Ban*!",
            );
          }

          const mentionedUser = getTargetUser(
            m,
            mentionByTag,
          );

          const senderIsMod = await checkMod(m.sender);

          if (
            !senderIsMod &&
            !isCreator &&
            !isintegrated()
          ) {
            await doReact("❌");

            return await Atlas.sendMessage(
              m.from,
              {
                text: "Sorry, only *Owners* and *Mods* can use this command!",
              },
              { quoted: m },
            );
          }

          const userId = mentionedUser;

          if (!userId) {
            await doReact("❌");

            return await m.reply(
              "Please tag or quote a valid user to unban.",
            );
          }

          try {
            const checkBanStatus =
              await checkBan(userId);

            if (checkBanStatus) {
              await unbanUser(userId);

              await doReact("✅");

              await Atlas.sendMessage(
                m.from,
                {
                  text: `@${getNumber(userId)} has been *Un-Banned* Successfully by *${pushName}*`,
                  mentions: [userId],
                },
                { quoted: m },
              );
            } else {
              await doReact("❌");

              return await Atlas.sendMessage(
                m.from,
                {
                  text: `@${getNumber(userId)} is not *Banned*!`,
                  mentions: [userId],
                },
                { quoted: m },
              );
            }
          } catch (err) {
            console.error(
              "[EXCEPTION] unban error:",
              err,
            );

            await doReact("❌");

            return await m.reply(
              `Failed to unban user: ${err?.message || err}`,
            );
          }

          break;
        }

        // ============================================================
        // BAN LIST
        // ============================================================

        case "banlist":
        case "listbans": {
          try {
            await doReact("📋");

            const [
              bannedUsers,
              bannedGroups,
            ] = await Promise.all([
              userData.find({ ban: true }),
              groupData.find({ bangroup: true }),
            ]);

            if (
              !bannedUsers.length &&
              !bannedGroups.length
            ) {
              return await Atlas.sendMessage(
                m.from,
                {
                  text: `🚫 *${typeof botName !== "undefined" ? botName : "Atlas MD"} Ban List*\n\nNo banned users or groups.`,
                },
                { quoted: m },
              );
            }

            let banlistText = `🚫 *${typeof botName !== "undefined" ? botName : "Atlas MD"} Ban List*\n\n`;

            if (bannedUsers.length) {
              banlistText += `👤 *Banned Users* (${bannedUsers.length})\n\n`;

              bannedUsers.forEach((u, i) => {
                if (u?.id) {
                  banlistText += `  ${
                    i + 1
                  }. @${getNumber(u.id)}\n`;
                }
              });
            }

            if (bannedGroups.length) {
              if (bannedUsers.length) {
                banlistText += "\n";
              }

              banlistText += `👥 *Banned Groups* (${bannedGroups.length})\n\n`;

              for (
                let i = 0;
                i < bannedGroups.length;
                i++
              ) {
                const gid = bannedGroups[i]?.id;

                if (!gid) continue;

                let gname = gid;

                try {
                  const meta =
                    await Atlas.groupMetadata(gid);

                  gname = meta.subject || gid;
                } catch {}
                
                banlistText += `  ${
                  i + 1
                }. ${gname}\n`;
              }
            }

            const mentions = bannedUsers
              .filter((u) => u?.id)
              .map((u) => u.id);

            await Atlas.sendMessage(
              m.from,
              {
                text: banlistText,
                mentions,
              },
              { quoted: m },
            );
          } catch (err) {
            console.error(
              "[EXCEPTION] banlist error:",
              err,
            );

            await doReact("❌");

            await m.reply(
              "An error occurred while fetching the ban list.",
            );
          }

          break;
        }

        // ============================================================
        // SET CHARACTER
        // ============================================================

        case "setchar": {
          if (!text) {
            await doReact("❌");

            return await Atlas.sendMessage(
              m.from,
              {
                text: "Please enter a character number between 0-19 to set!",
              },
              { quoted: m },
            );
          }

          const senderIsMod = await checkMod(
            m.sender,
          );

          if (
            !senderIsMod &&
            !isCreator &&
            !isintegrated()
          ) {
            await doReact("❌");

            return await Atlas.sendMessage(
              m.from,
              {
                text: "Sorry, only *Owners* and *Mods* can use this command!",
              },
              { quoted: m },
            );
          }

          const intinput = parseInt(text);

          if (
            Number.isNaN(intinput) ||
            intinput < 0 ||
            intinput > 19
          ) {
            await doReact("❌");

            return await Atlas.sendMessage(
              m.from,
              {
                text: "Please enter a character number between 0-19 to set!",
              },
              { quoted: m },
            );
          }

          const botNames = [
            "Atlas MD",
            "Power",
            "Makima",
            "Denji",
            "Zero Two",
            "Chika",
            "Miku",
            "Marin",
            "Ayanokoji",
            "Ruka",
            "Mizuhara",
            "Rem",
            "Sumi",
            "Kaguya",
            "Yumeko",
            "Kurumi",
            "Mai",
            "Yor",
            "Shinbou",
            "Eiko",
          ];

          const botLogos = [
            "https://wallpapercave.com/wp/wp5924545.jpg",
            "https://wallpapercave.com/wp/wp11253614.jpg",
            "https://images5.alphacoders.com/126/1264439.jpg",
            "https://i0.wp.com/metagalaxia.com.br/wp-content/uploads/2022/11/Chainsaw-Man-Denji-e-Power.webp?resize=1068%2C601&ssl=1",
            "https://images3.alphacoders.com/949/949253.jpg",
            "https://images4.alphacoders.com/100/1002134.png",
            "https://wallpapercave.com/wp/wp10524580.jpg",
            "https://images2.alphacoders.com/125/1257915.jpg",
            "https://wallpapers.com/images/file/kiyotaka-ayanokoji-in-pink-qs33qgqm79ccsq7n.jpg",
            "https://wallpapercave.com/wp/wp8228630.jpg",
            "https://images3.alphacoders.com/128/1288059.png",
            "https://images.alphacoders.com/711/711900.png",
            "https://moewalls.com/wp-content/uploads/2022/07/sumi-sakurasawa-hmph-rent-a-girlfriend-thumb.jpg",
            "https://wallpapercave.com/wp/wp6099650.png",
            "https://wallpapercave.com/wp/wp5017991.jpg",
            "https://wallpapercave.com/wp/wp2535489.jpg",
            "https://images4.alphacoders.com/972/972790.jpg",
            "https://images7.alphacoders.com/123/1236729.jpg",
            "https://wallpapercave.com/wp/wp4650481.jpg",
            "https://images8.alphacoders.com/122/1229829.jpg",
          ];

          try {
            const checkChar = await getChar();

            if (checkChar === intinput) {
              await doReact("✅");

              return await Atlas.sendMessage(
                m.from,
                {
                  image: {
                    url: botLogos[intinput],
                  },
                  caption: `Character number *${intinput}* - *${botNames[intinput]}* is already default!`,
                },
                { quoted: m },
              );
            }

            await setChar(intinput);

            await doReact("✅");

            await Atlas.sendMessage(
              m.from,
              {
                image: {
                  url: botLogos[intinput],
                },
                caption: `Character number *${intinput}* - *${botNames[intinput]}* has been set Successfully by *${pushName}*`,
              },
              { quoted: m },
            );
          } catch (err) {
            console.error(
              "[EXCEPTION] setchar error:",
              err,
            );

            await doReact("❌");

            return await m.reply(
              `Failed to set character: ${err?.message || err}`,
            );
          }

          break;
        }

        // ============================================================
        // CHARACTER LIST
        // ============================================================

        case "charlist":
        case "characters": {
          await doReact("📃");

          const botNames = [
            "Atlas MD",
            "Power",
            "Makima",
            "Denji",
            "Zero Two",
            "Chika",
            "Miku",
            "Marin",
            "Ayanokoji",
            "Ruka",
            "Mizuhara",
            "Rem",
            "Sumi",
            "Kaguya",
            "Yumeko",
            "Kurumi",
            "Mai",
            "Yor",
            "Shinbou",
            "Eiko",
          ];

          let charListMenu = `🎀 *${
            typeof botName !== "undefined"
              ? botName
              : "Atlas MD"
          } Characters* 🎀\n\n`;

          for (let i = 0; i < botNames.length; i++) {
            charListMenu += `  [ ${i} ] : *${botNames[i]}*\n`;
          }

          charListMenu += `\n*Select a character ID and use* \`${prefix}setchar <ID>\` *to set it.*`;

          return await Atlas.sendMessage(
            m.from,
            {
              text: charListMenu,
            },
            { quoted: m },
          );
        }

        // ============================================================
        // PM CHATBOT
        // ============================================================

        case "dmchatbot":
        case "pmchatbot": {
          if (!text) {
            await doReact("❌");

            return await m.reply(
              `Please provide On / Off action!\n\n*Example:*\n\n${prefix}pmchatbot on`,
            );
          }

          const senderIsMod = await checkMod(
            m.sender,
          );

          if (
            !senderIsMod &&
            !isCreator &&
            !isintegrated()
          ) {
            await doReact("❌");

            return await Atlas.sendMessage(
              m.from,
              {
                text: "Sorry, only *Owners* and *Mods* can use this command!",
              },
              { quoted: m },
            );
          }

          const pmChatBotStatus =
            await checkPmChatbot();

          await doReact("🧩");

          if (args[0] === "on") {
            if (pmChatBotStatus) {
              await doReact("❌");

              return await Atlas.sendMessage(
                m.from,
                {
                  text: "Private Chatbot is already *Enabled*!",
                },
                { quoted: m },
              );
            }

            await activateChatBot();

            return await m.reply(
              "*PM Chatbot* has been *Enabled* Successfully!\n\nBot will reply to all chats in PM!",
            );
          }

          if (args[0] === "off") {
            if (!pmChatBotStatus) {
              await doReact("❌");

              return await Atlas.sendMessage(
                m.from,
                {
                  text: "Private Chatbot is already *Disabled*!",
                },
                { quoted: m },
              );
            }

            await deactivateChatBot();

            return await m.reply(
              "*PM Chatbot* has been *Disabled* Successfully!",
            );
          }

          await doReact("❌");

          return await m.reply(
            `Please provide On / Off action!\n\n*Example:*\n\n${prefix}pmchatbot on`,
          );
        }

        // ============================================================
        // BAN GROUP
        // ============================================================

        case "bangroup":
        case "bangc": {
          if (!m.isGroup) {
            await doReact("❌");

            return await m.reply(
              "This command can only be used in groups!",
            );
          }

          const senderIsMod = await checkMod(
            m.sender,
          );

          if (
            !senderIsMod &&
            !isCreator &&
            !isintegrated()
          ) {
            await doReact("❌");

            return await Atlas.sendMessage(
              m.from,
              {
                text: "Sorry, only *Owners* and *Mods* can use this command!",
              },
              { quoted: m },
            );
          }

          const groupBanStatus =
            await checkBanGroup(m.from);

          if (groupBanStatus) {
            await doReact("❌");

            return await Atlas.sendMessage(
              m.from,
              {
                text: "This group is already *Banned*!",
              },
              { quoted: m },
            );
          }

          await doReact("🧩");

          await banGroup(m.from);

          return await m.reply(
            `*${groupName}* has been *Banned* Successfully!`,
          );
        }

        // ============================================================
        // UNBAN GROUP
        // ============================================================

        case "unbangroup":
        case "unbangc": {
          if (!m.isGroup) {
            await doReact("❌");

            return await m.reply(
              "This command can only be used in groups!",
            );
          }

          const senderIsMod = await checkMod(
            m.sender,
          );

          if (
            !senderIsMod &&
            !isCreator &&
            !isintegrated()
          ) {
            await doReact("❌");

            return await Atlas.sendMessage(
              m.from,
              {
                text: "Sorry, only *Owners* and *Mods* can use this command!",
              },
              { quoted: m },
            );
          }

          const groupBanStatus =
            await checkBanGroup(m.from);

          if (!groupBanStatus) {
            await doReact("❌");

            return await Atlas.sendMessage(
              m.from,
              {
                text: "This group is not banned!",
              },
              { quoted: m },
            );
          }

          await doReact("🧩");

          await unbanGroup(m.from);

          return await m.reply(
            `*${groupName}* has been *Unbanned* Successfully!`,
          );
        }

        // ============================================================
        // BOT MODE
        // ============================================================

        case "setbotmode":
        case "mode": {
          if (!text) {
            await doReact("❌");

            return await m.reply(
              `Please provide *Self / Private / Public* mode names!\n\n*Example:*\n\n${prefix}mode public`,
            );
          }

          const senderIsMod = await checkMod(
            m.sender,
          );

          if (
            !senderIsMod &&
            !isCreator &&
            !isintegrated()
          ) {
            await doReact("❌");

            return await Atlas.sendMessage(
              m.from,
              {
                text: "Sorry, only *Owners* and *Mods* can use this command!",
              },
              { quoted: m },
            );
          }

          const currentMode = await getBotMode();

          if (args[0] === "self") {
            if (currentMode === "self") {
              await doReact("❌");

              return await m.reply(
                `Bot is already in *Self* mode!\n\nOnly *Bot Hoster (Bot number)* can use bot.`,
              );
            }

            await doReact("🧩");

            await setBotMode("self");

            return await m.reply(
              "Bot has been set to *Self* mode Successfully!",
            );
          }

          if (args[0] === "private") {
            if (currentMode === "private") {
              await doReact("❌");

              return await m.reply(
                `Bot is already in *Private* mode!\n\nOnly bot *Owners / Mods* can use bot.`,
              );
            }

            await doReact("🧩");

            await setBotMode("private");

            return await m.reply(
              "Bot has been set to *Private* mode Successfully!",
            );
          }

          if (args[0] === "public") {
            if (currentMode === "public") {
              await doReact("❌");

              return await m.reply(
                "Bot is already in *Public* mode!\n\nAnyone can use bot.",
              );
            }

            await doReact("🧩");

            await setBotMode("public");

            return await m.reply(
              "Bot has been set to *Public* mode Successfully!",
            );
          }

          await doReact("❌");

          return await m.reply(
            `Please provide *Self / Private / Public* mode names!\n\n*Example:*\n\n${prefix}mode public`,
          );
        }

        // ============================================================
        // GET COMMAND / PLUGIN
        // ============================================================

        case "getcmd":
        case "getplugin":
        case "cmdfile": {
          if (!text) {
            return await m.reply(
              `Example:\n\n${prefix}getcmd runtime`,
            );
          }

          try {
            const pluginDir = "./Plugins";

            const files = fs.readdirSync(
              pluginDir,
            );

            let foundFile = null;

            for (const file of files) {
              const filePath = path.join(
                pluginDir,
                file,
              );

              if (!fs.statSync(filePath).isFile()) {
                continue;
              }

              const data = fs.readFileSync(
                filePath,
                "utf8",
              );

              if (
                data.includes(`"${text}"`) ||
                data.includes(`'${text}'`)
              ) {
                foundFile = file;
                break;
              }
            }

            if (!foundFile) {
              await doReact("❌");

              return await m.reply(
                "❌ Command plugin not found",
              );
            }

            const filePath = path.join(
              pluginDir,
              foundFile,
            );

            await doReact("🧩");

            return await Atlas.sendMessage(
              m.from,
              {
                document:
                  fs.readFileSync(filePath),
                fileName: foundFile,
                mimetype: "text/javascript",
              },
              { quoted: m },
            );
          } catch (e) {
            console.error(
              "[EXCEPTION] getcmd error:",
              e,
            );

            await doReact("❌");

            return await m.reply(
              `Error: ${e?.message || e}`,
            );
          }
        }

        default:
          break;
      }
    } catch (error) {
      /*
       * FINAL SAFETY NET
       *
       * If something unexpected happens anywhere inside this
       * moderator plugin, don't allow the plugin exception to
       * bring down the entire bot process.
       */
      console.error(
        "[MODERATOR PLUGIN ERROR]",
        error,
      );

      try {
        await doReact("❌");
      } catch {}

      try {
        await m.reply(
          "❌ An error occurred while processing that moderator command. The bot is still running.",
        );
      } catch {}
    }
  },
};