const { createClient } = require('@supabase/supabase-js')
const supabaseUrl = 'https://hwubjdluspzilthrveos.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dWJqZGx1c3B6aWx0aHJ2ZW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4OTA5NTEsImV4cCI6MjA3MDQ2Njk1MX0.qluqAhVLW-hq4vmnqB4rFc8qhbceVa_ZfMoGdRWmEz4";
const supabase = createClient(supabaseUrl, supabaseKey)

const supabaseInsert = async (info = {}) => {
    const { data, error } = await supabase
        .from('user')
        .insert(info)
        .select()

    if (error) {
        return Promise.reject(error)
    }
    return data;
}

const outputInsert = async (info = {}) => {
    let { data: readData } = await supabase
        .from('output')
        .select("*").eq('userid', info.userid);
    if (readData?.length) {
        const { data, error } = await supabase
            .from('output')
            .update({ input: info.input })
            .eq('userid', info.userid)
            .select();
        if (error) {
            return Promise.reject(error)
        }
        return data;
    }

    const { data, error } = await supabase
        .from('output')
        .insert(info)
        .select()
    if (error) {
        return Promise.reject(error)
    }
    return data;
}

const outputRead = async (userid) => {
    console.log("=========", userid)
    let { data, error } = await supabase
        .from('output')
        .select("*").eq('userid', userid).single();
    if (error) {
        return null;
    }
    if (data?.input) {
        return JSON.parse(data.input)
    }
    return null
}

const outputOtherRead = async (userid) => {
    let { data, error } = await supabase
        .from('output-other')
        .select("*").eq('userid', userid).single();
    if (error) {
        return null;
    }
    if (data?.input) {
        return JSON.parse(data.input)
    }
    return null
}



const outputOtherInsert = async (info = {}) => {
    let { data: readData } = await supabase
        .from('output-other')
        .select("*").eq('userid', info.userid);
    if (readData?.length) {
        const { data, error } = await supabase
            .from('output-other')
            .update({ input: info.input })
            .eq('userid', info.userid)
            .select();
        if (error) {
            return Promise.reject(error)
        }
        return data;
    }

    const { data, error } = await supabase
        .from('output-other')
        .insert(info)
        .select()
    if (error) {
        return Promise.reject(error)
    }
    return data;
}

const getUserName = async () => {
    let { data, error } = await supabase
        .from('user')
        .select("username")
    if (error) {
        return Promise.reject(error)
    }
    return data;
}

const getAllUsers = async () => {
    let { data, error } = await supabase
        .from('user')
        .select('*')
    if (error) {
        return Promise.reject(error)
    }
    return data;
}

const getAllSettingsByUserId = async (userid) => {
    let { data, error } = await supabase
        .from('settings')
        .select('*')
    if (error) {
        return Promise.reject(error)
    }
    const findId = data.find(item => item?.userid === userid)
    if (findId?.content) return findId.content;
    return null;
}


const settingsInsert = async (info = {}) => {
    const { data, error } = await supabase
        .from('settings')
        .insert(info)
        .select()

    if (error) {
        return Promise.reject(error)
    }
    return data;
}

const settingsUpdate = async ({
    userid,
    newContent
}) => {
    const { data, error } = await supabase
        .from('settings')
        .update({ content: newContent })
        .eq('userid', userid)
        .select()

    if (error) {
        return Promise.reject(error)
    }
    return data;
}



const findSettingsByUserId = async (userid) => {
    let { data, error } = await supabase
        .from('settings')
        .select('*')
    if (error) {
        return Promise.reject(error)
    }
    const findUserId = data.find(item => item?.userid === userid)
    return findUserId;
}

module.exports = {
    supabaseInsert,
    getUserName,
    getAllUsers,
    settingsInsert,
    findSettingsByUserId,
    settingsUpdate,
    getAllSettingsByUserId,
    outputInsert,
    outputOtherInsert,
    outputRead,
    outputOtherRead
};