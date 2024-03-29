
//Each question in the current session gets marked with an integer
var question_cnt = 0;

function load_content(opts){
    $('#api_hint').remove();
    $('#footer').css('margin-top', '100px');
    $('.my_container').css('margin-top', '2%');

    if(opts == 'GPT')
        $('#main').load('GPT.html');
    else
        $('#main').load('Text.html');
}

function enable_services(){
    let question = $('#Qtext1').val();
    if(question.trim() ==''){
        alert('Please Enter some text first!');
        return;
    }

    hide_tables();
    display_question(question);

    $('#Qtext1').val('');
    const static_cnt = question_cnt;
    $('#my_box').load('text_operations.html', function() {
        enable_operations(question, static_cnt); //for the current question (when continue is clicked)
    });

    question_cnt++;
}

function display_question(question){
    let Qcontainer = $('<div>').addClass('text_question');
    let Qtext = $('<div>').addClass('QnAtext');
    let Qpar  = $('<p>').text(question).css('padding-left', '10px');
    Qpar.attr("id", "resp" + question_cnt);     //it is named resp, so it works with the rest of the functions that are already implemented
    let Qheader = $('<h4>').text('T' + (question_cnt +1) + ': \u00a0');

    if(!(question_cnt % 2))
        Qcontainer.css('background-color', 'white');

    Qtext.prepend(Qheader);
    Qtext.append(Qpar);
    Qcontainer.append(Qtext);


    const static_cnt = question_cnt;
    Qcontainer.click(function(){
        enable_operations(question, static_cnt);    //when user clicks on a previous question's container
        animate_container(Qcontainer);
        hide_tables();
    });

    $('#chat_cont').append(Qcontainer);
}

//border animation on click of a specific question
function animate_container(Qcontainer){

    Qcontainer.addClass('animate_container');
    setTimeout(function() {
        Qcontainer.removeClass('animate_container');
    }, 300); // 300 milliseconds (0.3 seconds) matches the transition duration
}

function enable_operations(txt, static_cnt){
    console.log(txt + '  ' +static_cnt);

    $('#q_id_text').html('Selected: T' + (static_cnt +1));
    let mark_bnt  = $('#mark_btn');
    let info_bnt  = $('#ent_info_btn');
    let facts_btn = $('#get_facts_btn');
    let er_facts  = $('#get_fatcs_er_btn');

    //remove previously applied functions
    mark_bnt.off('click');
    info_bnt.off('click');
    facts_btn.off('click');
    er_facts.off('click');

    mark_bnt.click(function(){mark_entities(txt, static_cnt)});
    info_bnt.click(function (){get_ent_info(txt, static_cnt)});
    facts_btn.click(function (){get_facts(txt, static_cnt)});
    er_facts.click(function (){get_er_facts(txt, static_cnt)});

    if(jsonMap[static_cnt] !== undefined)   //an exei ginei proigoumenws annotation, theloume na kanoume enable to button
        $('#get_fatcs_er_btn').prop('disabled',false);
    else
        $('#get_fatcs_er_btn').prop('disabled',true);
}
