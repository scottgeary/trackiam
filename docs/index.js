const gitOwner = 'glassechidna';
const gitRepo = 'trackiam';

var currentDiff = [];

function generateListItemDetails(name, type, data, i) {
  const exists = currentDiff.find(x => x.to === data.files[i].filename);
  const isNew = exists.from == "/dev/null"
  if (exists && isNew) {
    return `${data.files[i].patch}`;
  }
  else {
    return `
      <ul class="list-group" id="item-${name}-${i}-list">

      </ul>
    `;
  };
}

function generateListItem(name, type, data, i) {
  return `
  <div class="card m-1">
    <div class="card-header" id="header-${name}-${i}">
      <h5 class="mb-0 d-flex justify-content-between align-items-center">
        <a class="btn btn-link" target="_blank" href="${data.html_url}">
          ${name}
        </a>
        <button type="button" class="btn btn-light" data-toggle="collapse" data-target="#item-${name}-${i}" aria-expanded="true" aria-controls="item-${name}-${i}">...</button>
      </h5>
    </div>

    <div id="item-${name}-${i}" class="collapse" aria-labelledby="header-${name}-${i}">
      <div id="item-${name}-${i}-body" class="card-body">
        ${generateListItemDetails(name, type, data, i)}
      </div>
    </div>
  </div>
  `;
}

function processListData(data) {
  var diff_url = data.url.replace("https://github.com", "https://api.github.com/repos");
  $.get({ url: diff_url, headers: { Accept: "application/vnd.github.v3.diff" } }, (diff) => {
    currentDiff = diffparser(diff);
    console.log(currentDiff);
    var policies_list = $("#policies_list");
    policies_list.empty();

    var services_list = $("#services_list");
    services_list.empty();

    data.files.forEach((value, i) => {
      var name = value.filename.split("/").reverse()[0].split('.')[0];
      var isPolicy = value.filename.startsWith("policies");
      var isService = value.filename.startsWith("services");
      var type = isPolicy ? 'policy' : isService ? 'service' : 'unknown';
      var element = generateListItem(name, type, data, i);
      if (isPolicy) policies_list.append(element)
      else if (isService) services_list.append(element)
    });
    if ($("#policies_list").is(':empty')) $("#policies_list").append('<li class="list-group-item">No results</li>');
    if ($("#services_list").is(':empty')) $("#services_list").append('<li class="list-group-item">No results</li>');
  });
}

function doCompare(from, to) {
  currentDiff = [];
  $.get(`https://api.github.com/repos/${gitOwner}/${gitRepo}/compare/${from}...${to}`, processListData);
}

function compareClick(ev) {
  var from = $("#from_commit_select")
  var to = $("#to_commit_select")
  setLocation(from.val(), to.val())
  doCompare(from.val(), to.val())
}

function setLocation(from, to) {
  var loc = new URL(document.location);
  loc.searchParams.set('from', from)
  loc.searchParams.set('to', to)
  if (window.history.pushState) window.history.pushState({}, `${from}...${to}`, loc)
  else document.location = loc;
}

function getLocation() {
  var loc = new URL(document.location);
  var from = loc.searchParams.get('from');
  var to = loc.searchParams.get('to');
  if (from) $("#from_commit_select").val(from);
  if (to) $("#to_commit_select").val(to);
  compareClick()
}

function main() {
  // githubAuth()
  $.get(`https://api.github.com/repos/${gitOwner}/${gitRepo}/commits`, data => {
    var from = $("#from_commit_select")
    var to = $("#to_commit_select")
    data.forEach((commit) => {
      var el = `<option value="${commit.sha}">
                      ${moment(commit.commit.author.date)} (${moment(commit.commit.author.date).fromNow()})</option>`
      from.append(el)
      to.append(el)
    });
    getLocation();
  });
}

// Events
$(document).ready(main);
$("#from_commit_select").on('change', compareClick)
$("#to_commit_select").on('change', compareClick)
