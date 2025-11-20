require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("spawn")
    .setDescription("Mostra a spawn rule de um Pokémon")
    .addStringOption(option =>
      option
        .setName("pokemon")
        .setDescription("Nome do Pokémon")
        .setRequired(true)
        .setAutocomplete(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("📢 Registrando comandos...");

    // Registro rápido no servidor (GUILD_ID)
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log("⚡ Comando registrado IMEDIATO no servidor (GUILD).");
    }

    // Registro global (pode demorar até 1 hora para aparecer)
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("🌍 Comando registrado GLOBAL.");
    
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
})();
