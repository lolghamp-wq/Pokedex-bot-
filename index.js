require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

// URL DO JSON HOSPEDADO (eu vou te mandar o link final pronto)
const JSON_URL = "COLOQUE_AQUI_O_LINK_DO_JSON";

async function loadPokemonData() {
  try {
    const response = await fetch(JSON_URL);
    return await response.json();
  } catch (err) {
    console.error("❌ Erro ao baixar JSON:", err);
    return {};
  }
}

// Normalizar nomes
function normalizeName(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let normalizedMap = {};
let pokemonList = [];

client.once("ready", async () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);

  const raw = await loadPokemonData();

  normalizedMap = {};
  pokemonList = [];

  for (const name of Object.keys(raw)) {
    normalizedMap[normalizeName(name)] = { name, data: raw[name] };
    pokemonList.push({
      real: name,
      normalized: normalizeName(name)
    });
  }

  console.log("✅ JSON carregado com sucesso!");
});

client.on("interactionCreate", async interaction => {

  // Autocomplete
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === "spawn") {
      const focused = normalizeName(interaction.options.getFocused());

      const matches = pokemonList
        .filter(p => p.normalized.startsWith(focused))
        .slice(0, 25)
        .map(p => ({ name: p.real, value: p.real }));

      await interaction.respond(matches.length ? matches : [
        { name: "Nenhum Pokémon encontrado", value: "none" }
      ]);

    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "spawn") {
    const input = interaction.options.getString("pokemon");

    if (input === "none") {
      return interaction.reply({
        content: "❌ Pokémon inválido.",
        ephemeral: true
      });
    }

    const key = normalizeName(input);
    const found = normalizedMap[key];

    if (!found) {
      return interaction.reply({
        content: `❌ Pokémon **${input}** não encontrado.`,
        ephemeral: true
      });
    }

    const { name, data } = found;

    const embed = new EmbedBuilder()
      .setTitle(name)
      .setColor(data.exists_in_addon ? 0x00ff99 : 0xff4444);

    // Sprite HD
    const pid = data.id.replace("p", "");
    const spriteURL = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pid}.png`;
    embed.setThumbnail(spriteURL);

    if (!data.exists_in_addon) {
      embed.setDescription("Status: **não tem spawn**");
      return interaction.reply({ embeds: [embed] });
    }

    if (!data.rules || !data.rules.length) {
      embed.setDescription("Existe na addon, mas sem regras de spawn.");
      return interaction.reply({ embeds: [embed] });
    }

    data.rules.forEach((r, i) => {
      const parts = [];

      if (r.biomes?.length) parts.push(`🌎 **Biomas:** ${r.biomes.join(", ")}`);
      if (r.spawn_chance !== undefined) parts.push(`🎯 **Chance:** ${r.spawn_chance}`);
      if (r.weight !== undefined) parts.push(`⚖️ **Weight:** ${r.weight}`);
      if (r.delay_min !== undefined) parts.push(`⏱ **Delay:** ${r.delay_min}–${r.delay_max}`);
      if (r.conditions?.length) parts.push(`📌 **Condições:** ${r.conditions.join(", ")}`);

      embed.addFields({
        name: data.rules.length > 1 ? `Regra ${i + 1}` : "Regra",
        value: parts.join("\n") || "Sem detalhes",
        inline: false
      });
    });

    return interaction.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
