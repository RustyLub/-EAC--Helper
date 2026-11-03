import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { showDashboard } from './dashboard';
export const data = new SlashCommandBuilder().setName('menu').setDescription('Open the interactive EAC Helper control panel');
export async function execute(interaction: ChatInputCommandInteraction) { await showDashboard(interaction, 'home'); }
