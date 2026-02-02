
import { supabase } from './supabase';

// --- USER PROFILE ---
export const getUserProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error('Error fetching profile:', error);
    }
    return data;
};

export const saveUserProfile = async (userId, profileData) => {
    const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...profileData })
        .select();

    if (error) console.error('Error saving profile:', error);
    return data;
};

// --- VOCAB PROGRESS ---
export const saveLearnedWord = async (userId, word, topicId) => {
    const { data, error } = await supabase
        .from('learned_vocab')
        .upsert({ user_id: userId, word: word, topic_id: topicId }, { onConflict: 'user_id, word' })
        .select();

    if (error) console.error('Error saving word:', error);
    return data;
};

export const getLearnedWords = async (userId) => {
    const { data, error } = await supabase
        .from('learned_vocab')
        .select('word')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching words:', error);
        return [];
    }
    return data.map(item => item.word);
};
