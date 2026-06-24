import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.0.0/+esm';

/**
 * Supabase 初始化
 */
const supabase = createClient(
    'https://nlpcfypmotplbqounddk.supabase.co',
    'sb_publishable_AmFO2kVQM6z_lliKqF6m_g_qQ-NktPB'
);

export async function fetchPetById(id) {
    try {
        const { data, error } = await supabase
            .from('pet')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            throw new Error(`查询 pet 详情时发生错误: ${error.message}`);
        }

        if (!data) {
            return { data: null, error: '未找到该宠物' };
        }

        return { data, error: null };

    } catch (err) {
        console.error('fetchPetById 错误:', err);
        return { data: null, error: err.message };
    }
}

export async function fetchPets({
                                    age = null,
                                    gender = null,
                                    size = null,
                                    breed = null,
                                    state = null,
                                    type = null,        // ✅ 新增
                                    limit = 21,         // ✅ 分页
                                    offset = 0          // ✅ 分页
                                } = {}) {
    try {
        const { data, error } = await supabase.rpc('search_pet', {
            p_age: age,
            p_gender: gender,
            p_size: size,
            p_breed: breed,
            p_state: state,
            p_type: type,     // ✅ 新增
            p_limit: limit,   // ✅ 必须传
            p_offset: offset  // ✅ 必须传
        });

        if (error) {
            throw new Error(`查询 pets 时发生错误: ${error.message}`);
        }

        return { data, error: null };

    } catch (err) {
        console.error('fetchPets 错误:', err);
        return { data: null, error: err.message };
    }
}