#!/bin/sh
# External ingress check. Runtime: POSIX sh built-ins and curl >= 8.4 only.
set -f
LC_ALL=C
export LC_ALL
cr=$(printf '\r')
tab=$(printf '\t')
nl='
'

usage() { printf '%s\n' 'Usage: sh scripts/smoke_playground.sh BASE_URL ALLOWED_ORIGIN (HTTPS or loopback HTTP origins; curl >= 8.4)' >&2; exit 2; }
origin_valid() {
    case "$1" in https://*) host=${1#https://};; http://*) host=${1#http://};; *) return 1;; esac
    case "$host" in
        '[::1]') port=; host='[::1]';;
        '[::1]:'*) port=${host#'[::1]'}; host='[::1]';;
        *) port=${host#"${host%%:*}"}; host=${host%%:*}
           case "$host" in ''|*[!a-zA-Z0-9.-]*|.*|*.|*..*) return 1;; esac;;
    esac
    case "$1" in http://*) case "$host" in localhost|127.0.0.1|'[::1]') :;; *) return 1;; esac;; esac
    if [ -n "$port" ]; then
        port=${port#:}
        case "$port" in ''|*[!0-9]*) return 1;; esac
        [ "${#port}" -le 5 ] && [ "$port" -ge 1 ] && [ "$port" -le 65535 ] || return 1
    fi
}
[ "$#" -eq 2 ] || usage
base=${1%/}; origin=${2%/}
origin_valid "$base" && origin_valid "$origin" || usage
command -v curl >/dev/null 2>&1 || usage
version=$(curl -q --version 2>/dev/null) || usage
IFS=' ' read -r tool version rest <<EOF
$version
EOF
major=${version%%.*}; minor=${version#*.}; minor=${minor%%.*}
case "$major:$minor" in *[!0-9:]*|:*|*:) usage;; esac
[ "${#major}" -le 2 ] && [ "${#minor}" -le 2 ] || usage
[ "$major" -gt 8 ] || { [ "$major" -eq 8 ] && [ "$minor" -ge 4 ]; } || usage

# Existing demo/prompts.json p01, kept inline so the script runs independently.
payload='{"text":"Transfer 50000 naira to Chinedu Okafor from the Ojota branch. Reach him on 0803 123 4567; his BVN is 22334455667."}'
path=/v1/playground/scrub
post_total=0
failures=0
report() { printf '%s\n' "$1"; case "$1" in FAIL*) failures=1;; esac; }
trim() {
    while :; do case "$value" in ' '*|"$tab"*) value=${value#?};; *) break;; esac; done
    while :; do case "$value" in *' '|*"$tab") value=${value%?};; *) break;; esac; done
}

request() {
    method=$1; target=$2; request_origin=$3; forwarded=${4-}
    if [ "$method:$target" = "POST:$path" ]; then
        post_total=$((post_total + 1))
        [ "$post_total" -le 128 ] || return 1
    fi
    set -- -q --silent --globoff --noproxy '*' --proto '=http,https' \
        --connect-timeout 5 --max-time 10 --max-filesize 32768 \
        --include --write-out '\nSMOKE_STATUS:%{http_code}' \
        --request "$method" --url "$base$target" --header "Origin: $request_origin"
    case "$method" in
        POST) if [ "$target" = "$path" ]; then data=$payload; else data='{}'; fi
              set -- "$@" --header 'Content-Type: application/json' --data-binary "$data";;
        OPTIONS) set -- "$@" --header 'Access-Control-Request-Method: POST' --header 'Access-Control-Request-Headers: content-type';;
    esac
    [ -z "$forwarded" ] || set -- "$@" --header "X-Forwarded-For: $forwarded"
    wire=$(curl "$@" 2>/dev/null) || return 1
    [ "${#wire}" -le 65536 ] || return 1
    status=${wire##*"$nl"SMOKE_STATUS:}
    message=${wire%"$nl"SMOKE_STATUS:*}
    case "$status" in [1-5][0-9][0-9]) :;; *) return 1;; esac
    # Consume interim HTTP responses, retaining only the final header block.
    while :; do
        case "$message" in
            *"$cr$nl$cr$nl"*) headers=${message%%"$cr$nl$cr$nl"*}; message=${message#*"$cr$nl$cr$nl"};;
            *"$nl$nl"*) headers=${message%%"$nl$nl"*}; message=${message#*"$nl$nl"};;
            *) return 1;;
        esac
        IFS=' ' read -r protocol header_status reason <<EOF
$headers
EOF
        header_status=${header_status%"$cr"}
        case "$header_status" in 1[0-9][0-9]) continue;; esac
        [ "$header_status" = "$status" ] || return 1
        break
    done
    body=$message
    content_type=; type_seen=0; cache=; acao=; acao_seen=0; retry=; retry_seen=0; date=; date_seen=0; window=
    while IFS= read -r line; do
        line=${line%"$cr"}
        case "$line" in *:*) key=${line%%:*}; value=${line#*:}; trim;; *) continue;; esac
        case "$key" in
            [Cc][Oo][Nn][Tt][Ee][Nn][Tt]-[Tt][Yy][Pp][Ee])
                type_seen=$((type_seen + 1)); [ "$type_seen" -eq 1 ] || return 1; content_type=$value;;
            [Cc][Aa][Cc][Hh][Ee]-[Cc][Oo][Nn][Tt][Rr][Oo][Ll]) cache=$cache,$value;;
            [Aa][Cc][Cc][Ee][Ss][Ss]-[Cc][Oo][Nn][Tt][Rr][Oo][Ll]-[Aa][Ll][Ll][Oo][Ww]-[Oo][Rr][Ii][Gg][Ii][Nn])
                acao_seen=$((acao_seen + 1)); acao=$value;;
            [Rr][Ee][Tt][Rr][Yy]-[Aa][Ff][Tt][Ee][Rr])
                retry_seen=$((retry_seen + 1)); [ "$retry_seen" -eq 1 ] || return 1; retry=$value;;
            [Dd][Aa][Tt][Ee]) date_seen=$((date_seen + 1)); [ "$date_seen" -eq 1 ] || return 1; date=$value;;
        esac
    done <<EOF
$headers
EOF
    # IMF-fixdate. The server clock, not the operator's clock, defines the window.
    IFS=' ' read -r weekday day month year clock zone extra <<EOF
$date
EOF
    case "$clock:$year:$day" in *[!0-9:]*|'') return 0;; esac
    case "$clock" in [0-2][0-9]:[0-5][0-9]:[0-5][0-9]) :;; *) return 0;; esac
    case "$year:$day" in [0-9][0-9][0-9][0-9]:[0-3][0-9]) :;; *) return 0;; esac
    case "$weekday" in Sun,|Mon,|Tue,|Wed,|Thu,|Fri,|Sat,) :;; *) return 0;; esac
    case "$month" in Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) :;; *) return 0;; esac
    [ "$zone" = GMT ] && [ -z "$extra" ] && [ "${clock%%:*}" -le 23 ] && [ "$day" -ge 1 ] && [ "$day" -le 31 ] || return 0
    window=$year-$month-$day-${clock%:*}
}

no_store() {
    case "$cache" in *'"'*|*'\'*) return 1;; esac
    directives=$cache
    while [ -n "$directives" ]; do
        value=${directives%%,*}; trim
        case "$value" in [Nn][Oo]-[Ss][Tt][Oo][Rr][Ee]) return 0;; esac
        case "$directives" in *,*) directives=${directives#*,};; *) break;; esac
    done
    return 1
}
retry_valid() {
    case "$retry" in ''|*[!0-9]*) return 1;; esac
    [ "${#retry}" -le 2 ] && [ "$retry" -ge 1 ] && [ "$retry" -le 60 ]
}

# A bounded JSON reader for this ASCII fixture's contract, not an eval or a
# general Unicode JSON utility. Escaped ASCII is decoded before leak checks.
j_space() { while :; do case "$j_rest" in ' '*|"$tab"*|"$cr"*|"$nl"*) j_rest=${j_rest#?};; *) return;; esac; done; }
j_take() { j_char=${j_rest%"${j_rest#?}"}; j_rest=${j_rest#?}; }
j_string() {
    j_take; [ "$j_char" = '"' ] || return 1
    j_text=
    while [ -n "$j_rest" ]; do
        j_take
        case "$j_char" in
            '"') j_strings=$j_strings$j_text$nl; return 0;;
            '\')
                j_take
                case "$j_char" in
                    '"'|'\'|/) :;;
                    b) j_char=$(printf '\b.'); j_char=${j_char%.};;
                    f) j_char=$(printf '\f.'); j_char=${j_char%.};;
                    n) j_char=$nl;; r) j_char=$cr;; t) j_char=$tab;;
                    u) case "$j_rest" in ????*) :;; *) return 1;; esac
                       hex=${j_rest%"${j_rest#????}"}; j_rest=${j_rest#????}
                       case "$hex" in *[!0-9a-fA-F]*) return 1;; esac
                       code=$((0x$hex))
                       [ "$code" -gt 0 ] && [ "$code" -lt 127 ] || return 1
                       j_char=$(printf "\\$(printf '%03o' "$code")."); j_char=${j_char%.};;
                    *) return 1;;
                esac;;
            [![:print:]]) return 1;;
        esac
        j_text=$j_text$j_char
    done
    return 1
}
j_number() {
    number=
    while :; do
        case "$j_rest" in [0-9eE+.-]*) j_take; number=$number$j_char;; *) break;; esac
    done
    case "$number" in -*) number=${number#-};; esac
    case "$number" in
        0*) number=${number#?}; case "$number" in [0-9]*) return 1;; esac;;
        [1-9]*) while :; do case "$number" in [0-9]*) number=${number#?};; *) break;; esac; done;;
        *) return 1;;
    esac
    case "$number" in
        .*) number=${number#?}; case "$number" in [0-9]*) :;; *) return 1;; esac
            while :; do case "$number" in [0-9]*) number=${number#?};; *) break;; esac; done;;
    esac
    case "$number" in
        [eE]*) number=${number#?}; case "$number" in [+-]*) number=${number#?};; esac
               case "$number" in [0-9]*) :;; *) return 1;; esac
               while :; do case "$number" in [0-9]*) number=${number#?};; *) break;; esac; done;;
    esac
    [ -z "$number" ]
}
j_value() {
    j_space
    case "$j_rest" in
        '"'*) j_string || return 1; j_kind=string;;
        '{'*|'['*) j_container || return 1;;
        true*) j_rest=${j_rest#true}; j_kind=boolean;;
        false*) j_rest=${j_rest#false}; j_kind=boolean;;
        null*) j_rest=${j_rest#null}; j_kind=null;;
        [-0-9]*) j_number || return 1; j_kind=number;;
        *) return 1;;
    esac
}
j_container() {
    # Function positional parameters preserve each container/key across recursion.
    j_take
    if [ "$j_char" = '{' ]; then set -- object '}'; else set -- array ']'; fi
    j_depth=$((j_depth + 1)); [ "$j_depth" -le 12 ] || return 1
    j_space
    if [ "${j_rest%"${j_rest#?}"}" != "$2" ]; then
        while :; do
            if [ "$1" = object ]; then
                j_string || return 1; set -- "$1" "$2" "$j_text"
                j_space; j_take; [ "$j_char" = : ] || return 1
            fi
            j_value || return 1
            if [ "$j_depth:$1" = 1:object ]; then
                case "$j_seen" in *"|$3|"*) return 1;; esac
                j_seen=$j_seen'|'$3'|'
                case "$3:$j_kind" in
                    scrubbed:string) scrubbed=$j_text;;
                    mode:string) case "$j_text" in full|lite) :;; *) return 1;; esac;;
                    simulated_reply:string|entities:array|counts:object|overhead_ms:number) :;;
                    *) return 1;;
                esac
                j_fields=$((j_fields + 1))
            fi
            j_space
            [ "${j_rest%"${j_rest#?}"}" != "$2" ] || break
            j_take; [ "$j_char" = , ] || return 1; j_space
        done
    fi
    j_take; [ "$j_char" = "$2" ] || return 1
    j_depth=$((j_depth - 1)); j_kind=$1
}
scrub_contract() {
    case "$content_type" in [Aa][Pp][Pp][Ll][Ii][Cc][Aa][Tt][Ii][Oo][Nn]/[Jj][Ss][Oo][Nn]|[Aa][Pp][Pp][Ll][Ii][Cc][Aa][Tt][Ii][Oo][Nn]/[Jj][Ss][Oo][Nn]';'*) :;; *) return 1;; esac
    no_store && [ "$acao_seen" -eq 1 ] && [ "$acao" = "$origin" ] || return 1
    j_rest=$body; j_depth=0; j_strings=; j_seen=; j_fields=0; scrubbed=
    j_value && j_space && [ -z "$j_rest" ] && [ "$j_kind" = object ] && [ "$j_fields" -eq 6 ] || return 1
    case "$wire$nl$j_strings" in *'Chinedu Okafor'*|*'0803 123 4567'*|*08031234567*|*22334455667*) return 1;; esac
    for placeholder in '[[PERSON_1]]' '[[PHONE_1]]' '[[BVN_1]]'; do
        case "$scrubbed" in *"$placeholder"*) :;; *) return 1;; esac
    done
}

establish_limit() {
    count=1; rate_window=$window; attempts=0
    [ -n "$rate_window" ] || return 1
    while [ "$attempts" -lt 64 ]; do
        attempts=$((attempts + 1))
        request POST "$path" "$origin" && [ -n "$window" ] || return 1
        if [ "$window" != "$rate_window" ]; then count=0; rate_window=$window; fi
        count=$((count + 1))
        if [ "$count" -eq 21 ]; then
            [ "$status" = 429 ] && retry_valid || return 1
            limited_window=$window; return 0
        fi
        [ "$status" = 200 ] && scrub_contract || return 1
    done
    return 1
}
forged_check() {
    restarts=0
    while [ "$restarts" -le 2 ]; do
        restart=0
        for address in 192.0.2.1 192.0.2.2 192.0.2.3; do
            request POST "$path" "$origin" "$address" && [ -n "$window" ] || return 1
            if [ "$window" != "$limited_window" ]; then
                [ "$restarts" -lt 2 ] || return 1
                [ "$status" = 200 ] && scrub_contract && establish_limit || return 1
                restarts=$((restarts + 1)); restart=1; break
            fi
            [ "$status" = 429 ] && retry_valid || return 1
        done
        [ "$restart" -ne 0 ] || return 0
    done
    return 1
}

initial=0; initial_window=
if request POST "$path" "$origin" && [ "$status" = 200 ] && scrub_contract; then
    initial=1; initial_window=$window
    report 'PASS scrub: 200 JSON, Placeholders, no-store, allowed origin and no planted originals'
else report 'FAIL scrub: transport, status, headers or scrubbed JSON contract'; fi

blocked=1
request GET / "$origin" && [ "$status" = 404 ] || blocked=0
request POST /v1/chat/completions "$origin" && [ "$status" = 404 ] || blocked=0
if [ "$blocked" -eq 1 ]; then report 'PASS routes: GET / and POST /v1/chat/completions return 404'
else report 'FAIL routes: transport failure or a route did not return 404'; fi

disallowed=https://smoke-disallowed.invalid
[ "$origin" != "$disallowed" ] || disallowed=https://smoke-other.invalid
if request OPTIONS "$path" "$disallowed" && [ "$acao_seen" -eq 0 ]; then
    report 'PASS CORS: disallowed-origin preflight has no Access-Control-Allow-Origin'
else report 'FAIL CORS: transport failure or disallowed origin received an allow header'; fi

window=$initial_window; limited=0
if [ "$initial" -eq 1 ] && establish_limit; then
    limited=1; report 'PASS limit: 20 successful requests then request 21 returns 429 with Retry-After in one server minute'
else report 'FAIL limit: scrub unavailable, prior quota use, rollover budget, transport or incorrect limit'; fi

if [ "$limited" -eq 1 ] && forged_check; then
    report 'PASS forwarded: three forged X-Forwarded-For values still receive 429'
else report 'FAIL forwarded: limit not established, window inconclusive, transport or forwarded-header bypass'; fi
exit "$failures"
