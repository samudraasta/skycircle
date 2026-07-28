const url = 'https://script.google.com/macros/s/AKfycbx9zIBE4I_W33gR0dvY3C3UejkdQ_eDw8Yfdy7X0OkBKTJ6gvl_urL2ALuQWYcIQC8Lbg/exec';
fetch(url, {
    method: 'POST',
    body: JSON.stringify({ action: "get_students" })
})
.then(res => res.text())
.then(text => {
    console.log("Response text:", text.substring(0, 500));
    try {
        let json = JSON.parse(text);
        console.log("Valid JSON:", Object.keys(json));
    } catch(e) {
        console.log("Invalid JSON:", e.message);
    }
})
.catch(e => console.error("Fetch failed:", e));
