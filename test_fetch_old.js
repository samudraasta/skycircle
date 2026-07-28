const url = 'https://script.google.com/macros/s/AKfycbxxBNmpogyqo1iEYy3j6mZld6lmc6PPb5sde67cjQKsKEfinbIPojU2WRN0_Mf4Bhd8rQ/exec';
fetch(url, {
    method: 'POST',
    body: JSON.stringify({ action: "get_students" })
})
.then(res => res.text())
.then(text => {
    console.log("Response text length:", text.length);
    console.log("Snippet:", text.substring(0, 300));
    try {
        let json = JSON.parse(text);
        console.log("Success JSON:", json.status);
    } catch(e) {
        console.log("Invalid JSON:", e.message);
    }
})
.catch(e => console.error("Fetch failed:", e));
