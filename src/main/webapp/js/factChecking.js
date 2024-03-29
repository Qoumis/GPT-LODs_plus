
const adaptive_url = 'http://93.115.20.167:5000/';

var fact_map = {};
const already_displayed_facts = new Array(100).fill(false);
var last_displayed_fact = 0;

var fact_map_ER = {};
const already_displayed_ER = new Array(100).fill(false);
var last_displayed_ER = 0;

var triples;
var triples_unsplit;
var jsonFile;

function get_facts(text, respID){
    $('#fail_msg').css('display', 'none');
    if (fact_map[respID] !== undefined)    //if already called the API for this specific response
        create_fact_table(respID);
    else {
        //make the request to chat-GPT
        call_Fact_Java(text, respID)
            .then(rdf => {
                fact_map[respID] = rdf.trim();
                console.log(fact_map[respID]);
                create_fact_table(respID);
            })
            .catch(error => {
                console.error(error);
            });
    }
}

function get_er_facts(text, respID){
    $('#fail_msg').css('display', 'none');
    if (fact_map_ER[respID] !== undefined)    //if already called the API for this specific response
        create_fact_table_ER(respID);
    else {
        let enhanced_txt = enchance_with_dblinks(text, respID);
        //make the request to chat-GPT
        call_Fact_Java(enhanced_txt, respID)
            .then(rdf => {
                fact_map_ER[respID] = rdf.trim();
                console.log(fact_map_ER[respID]);
                create_fact_table_ER(respID);
            })
            .catch(error => {
                console.error(error);
            });
    }

}

/**Get GPT rdf-response by calling the python API*/
function call_Fact_Python(text){

    return new Promise((resolve, reject) => {
        const facts_btn = $('#get_facts_btn');
        facts_btn.prop('disabled', true);

        let xhr = new XMLHttpRequest();
        xhr.onload = function (){
            if(xhr.readyState === 4 && xhr.status === 200){
                facts_btn.prop('disabled', false);
                resolve(xhr.responseText);
            }
            else if (xhr.status !== 200) {
                const error = "Something went wrong server responded with: \n" + xhr.responseText;
                facts_btn.prop('disabled', false);
                reject(error);
            }
        };
        xhr.onabort = function (){
            facts_btn.prop('disabled', false);
        }
        xhr.onerror = function (){
            facts_btn.prop('disabled', false);
        }
        xhr.ontimeout = function (){
            facts_btn.prop('disabled', false);
        }

        let numOfFacts = 5;
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // Proxy to work with tomcat, should remove later! (should request access before making requests)
        let target_url = adaptive_url + 'getChatGPTFacts/' + text.replace('?', '') + '/' + 'DaVinci/Text/' + numOfFacts;

        xhr.open('GET',target_url);
        xhr.setRequestHeader('Content-type','application/json');
        xhr.send();
    });
}

/**Get GPT rdf-response by directly calling chat-gpt API*/
function call_Fact_Java(text, respID){
    return new Promise((resolve, reject) => {
        const facts_btn = $('#get_facts_btn');
        facts_btn.prop('disabled', true);
        const er_facts_btn = $('#get_fatcs_er_btn');
        er_facts_btn.prop('disabled', true);

        let xhr = new XMLHttpRequest();
        xhr.onload = function (){
            if(xhr.readyState === 4 && xhr.status === 200){
                resolve(xhr.responseText);
            }
            else if (xhr.status !== 200) {
                const error = "Something went wrong server responded with: \n" + xhr.responseText;
                reject(error);
            }
            //re-enable buttons
            facts_btn.prop('disabled', false);
            if(jsonMap[respID] !== undefined)   //mono an exei proigithei annotation to kanoume re-enable
                er_facts_btn.prop('disabled',false);
        };

        let data = $('#InitialForm').serialize();
        let input = 'Give me just the RDF N-triples using DBpedia format for the text : ' + text ;
        let url = 'GPTanswerFacts?' + data + '&question=' + input;

        xhr.open('GET',url);
        xhr.setRequestHeader('Content-type','application/x-www-form-urlencoded');
        xhr.send();
    });
}

/**provides the dbpedia link for each recognized entity
 * (Used when calling chat GPT for fact checking with ER, asking it to give us the RDF N-triples for a text*/
function enchance_with_dblinks(text, respID){
    if(jsonMap[respID] !== undefined) {  //prepei na exei proigithei annotation
        jsonMap[respID].forEach(item => {
            if (item.isEntity) {
                let rega = new RegExp('\\b' + item.textpart + '\\b', 'i');

                text = text.replace(rega, item.textpart + ' (' + item.dbpediaURI + ')');
            }
        });
    }
    return text;
}

//for enhanced get facts button
function create_fact_table_ER(respID){
    if (!already_displayed_ER[respID]) {

        triples_unsplit = fact_map_ER[respID];
        triples = fact_map_ER[respID].split("\n")
                                     .filter(line => line.trim() !== ""    //get rid of intermediate blank lines
                                        && line.trim().startsWith("<"))  // and lines that dont contain triples

        //markaroume prin to generation gia tin periptwsi pou den paragontai tripletes kai theloume ola ta displayed na einai false
        already_displayed_ER[last_displayed_ER] = false;   //na markarei me closed to teleutaio pou eixe anoiksei
        already_displayed_ER[respID] = true;                 //markarei me open auto pou anoikse twra
        last_displayed_ER = respID;                           //to krataei ws teleutaio

        //all table creation related work happens here
        generate_table(respID, true);
        $('#facts_cont').css('display', 'block');

        already_displayed_facts[last_displayed_fact] = false; //markare to teleutaio regular get_facts (se periptwsi pou itan anoixto kapoio)

        //kleise to entities table (an upirxe kapoio anoixto)
        $('#entities_cont').css('display', 'none');
        already_displayed[last_displayed] = false;
    }
    else {
        $('#facts_cont').css('display', 'none');
        $('#validation_cont').css('display', 'none');
        already_displayed_ER[respID] = false;
    }
}

function create_fact_table(respID){
    if (!already_displayed_facts[respID]) {

        triples_unsplit = fact_map[respID];
        triples = fact_map[respID].split("\n")
                                  .filter(line => line.trim() !== ""    //get rid of intermediate blank lines
                                      && line.trim().startsWith("<"))  // and lines that dont contain triples

        //markaroume prin to generation gia tin periptwsi pou den paragontai tripletes kai theloume ola ta displayed na einai false
        already_displayed_facts[last_displayed_fact] = false;   //na markarei me closed to teleutaio pou eixe anoiksei
        already_displayed_facts[respID] = true;                 //markarei me open auto pou anoikse twra
        last_displayed_fact = respID;                           //to krataei ws teleutaio

        //all table creation related work happens here
        generate_table(respID, false);
        $('#facts_cont').css('display', 'block');

        already_displayed_ER[last_displayed_ER] = false; //markare to teleutaio enhanced get_facts (se periptwsi pou itan anoixto kapoio)

        //kleise to entities table (an upirxe kapoio anoixto)
        $('#entities_cont').css('display', 'none');
        already_displayed[last_displayed] = false;
    }
    else {
        $('#facts_cont').css('display', 'none');
        $('#validation_cont').css('display', 'none');
        already_displayed_facts[respID] = false;
    }
}

//Creation of facts table for both regular and enhanced facts
function generate_table(respID,ER){

    $('#facts_table tr:not(:first-child)').remove(); //delete any previous rows
    let table  = $('#facts_table');
    let flag = 0;
    let factNo = 1;
    triples.forEach(tr => {
        let triple = tr.split("> ");       //get single triple

        if(triple.length >= 3){
            let sub = triple[0].replace("<", "");
            let prd = triple[1].replace("<", "");
            let obj = triple[2].replace("<", "");

            if (sub.startsWith("http"))
                sub = '<a href="' + sub + '" target="_blank">' + getSuffix(sub) + '</a>';
            if (prd.startsWith("http"))
                prd = '<a href="' + prd + '" target="_blank">' + getSuffix(prd) + '</a>';
            if (obj.startsWith("http"))
                obj = '<a href="' + obj + '" target="_blank">' + getSuffix(obj).replace("?", "") + '</a>';

            let Row = $('<tr> <td align="center">' + factNo++ + '</td> <td >' + sub + '</td><td >' + prd +
                '</td><td>' + obj.split('^^')[0] + '</td>' +
                '<td align="center"><button id="valid'+(factNo - 2)+'" onclick="validate_Facts(' + (factNo - 2) + ')">Validate Fact</button></td></tr>');
            table.append(Row);
            flag = 1;
        }
    });

    if(!flag) {
        $('#fail_msg').css('display', 'block');
        $('#facts_table').css('display', 'none');
        $('#facts_opts').css('display', 'none');

        //remove the contents of this response from the session, so that user can try again to generate triples
        if(ER) {
            delete fact_map_ER[respID];
            already_displayed_ER[last_displayed_ER] = false;
        }
        else {
            delete fact_map[respID];
            already_displayed_facts[last_displayed_fact] = false;
        }
    }
    else {
        $('#fail_msg').css('display', 'none');
        $('#facts_table').css('display', 'table');
        $('#facts_opts').css('display', 'block');

        let download_triples = $('<button id="download_triples" onclick="download_triples(' + respID + ','+ ER +')">Download Triples </button>');
        $('#download_triples').remove();
        $('#facts_opts').prepend(download_triples);

        let lodchain_btn = $('<button id="lodchain_btn" onclick="connect_lodChain(' + respID + ','+ ER +')">Connect to LODchain</button>');
        $('#lodchain_btn').remove();
        $('#facts_opts').prepend(lodchain_btn);
    }
}


function getSuffix(str) {
    if (!str.startsWith("http"))
        return str;
    let str2 = str.split("/")
    let str3 = str2[str2.length - 1].split("#")
    return str3[str3.length - 1].replace("_", " ");
}

function download_triples(respID, ER){
    let triples;
    if(ER)
        triples = fact_map_ER[respID];
    else
        triples = fact_map[respID];

    triples = triples.split("\n")
           .filter(line => line.trim() !== ""    //get rid of intermediate blank lines
                && line.trim().startsWith("<"));  // and lines that dont contain triples
    triples = triples.join("\n");
    const dwnld = document.createElement("a");
    const file = new Blob([triples], {type: "text/plain"});
    dwnld.href = URL.createObjectURL(file);
    dwnld.download = 'receivedTriples.nt';
    dwnld.click();
}

function download_validated_json(){
    const dwnld = document.createElement("a");
    const file = new Blob([jsonFile], {type: "text/plain"});
    dwnld.href = URL.createObjectURL(file);
    dwnld.download = 'validatedTriples.json';
    dwnld.click();
}

function validate_Facts(index = -1){
    let kg = $('input[name="kg-model"]:checked').val();

    let valid_bnt;
    let body;
    if(index !== -1) {
        body = triples[index];
        valid_bnt  = $('#valid' + index);
    }
    else {
        body = triples_unsplit;
        valid_bnt = $('#valid_all');
    }
    valid_bnt.prop('disabled', true);

    let xhr = new XMLHttpRequest();
    xhr.onload = function (){
        if(xhr.readyState === 4 && xhr.status === 200){

            jsonFile = xhr.responseText;  //for the downloadable
            const jsonResponse = JSON.parse(xhr.responseText);
            console.log(jsonResponse);
            let factNo = 1;
            if(index !== -1)
                factNo = index + 1;

            $('#validation_cont').html('<h1 align="center">Facts Validation using ' + kg + ' KG</h1><br>')
            for(const key in jsonResponse){
                let gptFact = getSuffix(jsonResponse[key].chatGPT_fact.subject) + " " +
                              getSuffix(jsonResponse[key].chatGPT_fact.predicate) + " " +
                              getSuffix(jsonResponse[key].chatGPT_fact.object).split("^^")[0];
                $('#validation_cont').append("<h3 align='center'> ChatGPT Fact " + factNo++ + ": " + gptFact + "</h3>");

                var kgFacts = jsonResponse[key].KG_Facts;
                var valid_table = "";
                if (kgFacts == "Entity Not Found in the KG") {
                    $('#validation_cont').append('<br><div align="center" style="font-size: 24px">Entity ' + '<a href="' + jsonResponse[key].chatGPT_fact.subject + '" target="_blank">' +
                                          getSuffix(jsonResponse[key].chatGPT_fact.subject) + '</a>' + '  Not Found in the KG</div>');
                }
                else{
                    valid_table += '<table><tbody><tr style="font-weight: bold;"><td>Rank</td><td>Subject</td>' +
                                      '<td>Predicate</td><td>Object</td><td>Similarity</td><td>Rule</td></tr>';
                    let rank = 1;
                    for (const key2 in kgFacts) {

                        var status ="";
                        if (kgFacts[key2].type == "Same or Equivalent Triple")
                            status = '<div align="center" style=" color:green;font-size: 24px;">Verified Correctly (Same or Equivalent Triple Found)</div>';
                        else if (kgFacts[key2].type == "Same Predicate - Different Object")
                            status = '<div align="center" style="font-size: 24px;"> Same Predicate - <span style="color:orange"> Different Object</span> Found </div>';
                        else if (kgFacts[key2].type == "Same Object - Different Predicate")
                            status = '<div align="center" align="center" style="font-size: 24px;"> Same Object - <span style="color:orange"> Different Predicate </span>Found </div>';
                        else
                            status = '<div align="center" style="color:orange;font-size: 24px;">' + kgFacts[key2].type + ' Found</div>';

                        let sub = kgFacts[key2].subject;
                        let prd = kgFacts[key2].predicate;
                        let obj = kgFacts[key2].object;
                        //subject
                        if (sub.startsWith("http"))
                            sub = '<a href="' + sub + '" target="_blank">' + getSuffix(sub) + '</a>';

                        //predicate
                        if(prd.startsWith("http")){
                            if (kgFacts[key2].type == "Same Object - Different Predicate" || kgFacts[key2].type == "Most Similar Triples")
                                prd = '<a style="color:orange" href="' + prd + '" target="_blank">' + getSuffix(prd) + '</a>';
                            else
                                prd = '<a href="' + prd + '" target="_blank">' + getSuffix(prd) + '</a>';
                        }

                        //object
                        if (obj.startsWith("http")) {
                            if (kgFacts[key2].type == "Same Predicate - Different Object" || kgFacts[key2].type == "Most Similar Triples")
                                obj = '<a style="color:orange" href="' + obj + '" target="_blank">' + getSuffix(obj) + '</a>';
                             else
                                obj = '<a href="' + obj + '" target="_blank">' + getSuffix(obj) + '</a>';
                        }
                        else if (kgFacts[key2].type == "Same Predicate - Different Object" || kgFacts[key2].type == "Most Similar Triples")
                            obj = '<span style="color:orange;">' + obj + '</span>';

                        valid_table += '<tr><td>' + rank++ + '</td><td>' + sub + '</td><td>' + prd + '</td><td>'
                                    + obj + '</td><td>' + kgFacts[key2].threshold
                                    + '</td><td>' + kgFacts[key2].type + '</td></tr>';
                    }
                    valid_table += '</tbody></table>';
                }
                $('#validation_cont').append('<br>' + status + '<br>');
                $('#validation_cont').append(valid_table + '<br>');
            }

            $('#validation_cont').append('<div align="center" style="margin-bottom: 2%;"><button onclick="download_validated_json()">Download as JSON</button></div>');
            $('#validation_cont').css('display', 'block');
        }
        else if (xhr.status !== 200) {
            console.log("Error" + xhr.status + "Server responded with : " + xhr.responseText);
        }
        valid_bnt.prop('disabled', false);
    };

    xhr.open("POST", adaptive_url + 'factChecking/' + kg);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send(body);
}

function connect_lodChain(respID,ER){
    let triples;
    if(ER)
        triples = fact_map_ER[respID];
    else
        triples = fact_map[respID];

    triples = triples.split("\n")
                     .filter(line => line.trim() !== ""    //get rid of intermediate blank lines
                        && line.trim().startsWith("<"));  // and lines that dont contain triples
    triples = triples.join("\n");

    let xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            //Antikatastiste to URI paremeter an den einai to swsto.
            let URL = "https://demos.isl.ics.forth.gr/LODChain/LODChain?URI=http://83.212.101.188:8081/GPT-1.0-SNAPSHOT/files/" + xhr.responseText;
            window.open(URL, '_blank');
        } else if (xhr.status !== 200) {
            console.log("Error" + xhr.status + "Server could not handle the request. Please try again");
        }
    }

    xhr.open("POST", 'ConnectToLodchain');
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send(triples);
}