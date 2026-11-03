import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { showDashboard } from './dashboard';
export const data = new SlashCommandBuilder().setName('settings').setDescription('Open the EAC Helper server settings panel');
export async function execute(interaction: ChatInputCommandInteraction) { await showDashboard(interaction, 'settings'); }
