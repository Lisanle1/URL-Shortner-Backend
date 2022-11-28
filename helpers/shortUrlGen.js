const ShortId = () =>{
    let shortId='';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charsLength= chars.length;
    for(let i=0; i<5; i++){
        shortId += chars.charAt(Math.floor(Math.random()*charsLength))
    } 
    return shortId;
}
module.exports=ShortId;