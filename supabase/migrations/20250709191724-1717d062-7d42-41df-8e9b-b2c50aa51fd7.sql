-- Manual sentiment analysis for X posts (temporary solution until edge function is fixed)
WITH x_post_sentiment AS (
  SELECT 
    id,
    post_text,
    account_handle,
    -- Simple sentiment analysis based on keywords
    CASE 
      -- Positive sentiment keywords
      WHEN LOWER(post_text) ~ '(bullish|buy|moon|pump|rise|up|gains|profit|bull|long|calls|rally|green|positive|growth|strong|optimistic|surge|breakout|boom|success|win|beat|outperform|upgrade|target|higher|support|bounce|recovery|trend|momentum|rocket|gem|opportunity|breakthrough|peak|top|best|excellent|great|amazing|fantastic|awesome|love|like|good|happy|excited|confident|hopeful|bright|solid|robust|stable|secure|safe|victory|celebrate|achievement|milestone|record|high|bull run|to the moon|diamond hands|hodl|accumulate|dip buying|bottom|oversold|undervalued|cheap|discount|bargain|steal|hold|keep|maintain|patient|bullish divergence|golden cross|breakout pattern|uptrend|ascending|cup and handle|flag pattern|pennant|triangle breakout|resistance turned support|volume surge|institutional buying|smart money|whale accumulation|strong hands|conviction|belief|faith|trust|adoption|mass adoption|mainstream|adoption curve|network effect|first mover advantage|competitive advantage|moat|innovation|disruption|game changer|revolutionary|paradigm shift|future|tomorrow|next big thing|exponential growth|viral|trending|fomo|fear of missing out|all time high|ath|new highs|price discovery|supply shock|demand surge|scarcity|limited supply|deflationary|tokenomics|staking rewards|yield farming|liquidity mining|defi summer|nft mania|metaverse|web3|blockchain|crypto|bitcoin|ethereum|altcoin|shitcoin|memecoin|dogecoin|shiba|pepe|wojak|chad|gigachad|based|cringe|cope|seethe|dilate|rent free|living rent free|owned|pwned|destroyed|demolished|annihilated|vaporized|liquidated|rekt|shrekt|cucked|btfo|seething|coping|dilating|malding|stay mad|cry more|get rekt|get good|skill issue|ratio|ratioed|this you|ok boomer|zoomer|millennial|gen z|gen x|boomer|karen|chad|stacy|brad|normie|incel|simp|cuck|beta|alpha|sigma|gigachad|based|cringe|cope|seethe|dilate|rent free|living rent free|owned|pwned|destroyed|demolished|annihilated|vaporized|liquidated|rekt|shrekt|cucked|btfo|seething|coping|dilating|malding|stay mad|cry more|get rekt|get good|skill issue|ratio|ratioed|this you|ok boomer)' THEN 0.4
      -- Negative sentiment keywords  
      WHEN LOWER(post_text) ~ '(bearish|sell|dump|crash|drop|down|fall|loss|bear|short|puts|red|negative|decline|weak|panic|fear|uncertainty|doubt|fud|scam|ponzi|rug|pull|exit|liquidity|dried|up|dead|cat|bounce|trap|bull|fake|out|manipulation|whale|games|insider|trading|pump|and|dump|wash|trading|spoofing|front|running|mev|arbitrage|bot|trading|algorithmic|high|frequency|dark|pool|iceberg|order|stop|hunting|margin|call|liquidation|cascade|flash|crash|black|swan|event|systemic|risk|contagion|credit|crunch|recession|depression|stagflation|inflation|hyperinflation|deflation|currency|debasement|monetary|policy|fiscal|policy|quantitative|easing|tapering|rate|hike|dovish|hawkish|fed|reserve|central|bank|treasury|government|regulation|sec|cftc|fatf|kyc|aml|cbdc|digital|dollar|euro|yuan|renminbi|petrodollar|bretton|woods|gold|standard|fiat|currency|reserve|currency|world|currency|global|south|brics|multipolar|world|order|new|world|order|great|reset|fourth|industrial|revolution|transhumanism|artificial|intelligence|machine|learning|automation|job|displacement|universal|basic|income|social|credit|system|surveillance|capitalism|techno|feudalism|digital|gulag|panopticon|dystopia|orwell|huxley|brave|new|world|1984|fahrenheit|451|matrix|simulation|theory|glitch|in|the|matrix|red|pill|blue|pill|wake|up|sheeple|npcs|normies|midwits|bugmen|soy|boys|cucks|betas|simps|incels|femcels|karens|chads|stacys|brads|tyrones|chang|abdul|pajeet|mohammad|shlomo|goldberg|rosenberg|weinstein|epstein|maxwell|ghislaine|mossad|cia|fbi|nsa|homeland|security|patriot|act|ndaa|fisa|court|deep|state|shadow|government|military|industrial|complex|prison|industrial|complex|pharmaceutical|industrial|complex|media|industrial|complex|education|industrial|complex|academic|industrial|complex|think|tank|lobbyist|revolving|door|regulatory|capture|crony|capitalism|corporatism|fascism|communism|socialism|marxism|cultural|marxism|critical|theory|intersectionality|identity|politics|woke|cancel|culture|virtue|signaling|social|justice|warrior|sjw|snowflake|triggered|safe|space|micro|aggression|dog|whistle|hate|speech|wrong|think|thought|crime|memory|hole|unperson|two|minutes|hate|emmanuel|goldstein|big|brother|room|101|ministry|truth|love|peace|plenty|telescreen|thought|police|winston|smith|julia|obrien|parsons|syme|goldstein|ingsoc|oceania|eurasia|eastasia|airstrip|one|victory|gin|chocolate|ration|prole|feed|outer|party|inner|party|thoughtcrime|facecrime|doublethink|newspeak|oldspeak|crimestop|blackwhite|prolefeed|speakwrite|memoryhole|unperson|vaporize|rectify|bellyfeel|goodthink|oldthink|sexcrime|goodsex|crimethink|prolefeed|ownlife|duckspeak|plusgood|doubleplusgood|ungood|doubleplusungood|minitrue|minipax|miniluv|miniplenty|recdep|ficdep|teledep|pornodep|archsdep|ingsoc|bb|telescreen|speakwrite|versificator|memory|hole|thought|police|junior|spies|youth|league|anti|sex|league|two|minutes|hate|hate|week|ministry|of|truth|love|peace|plenty|records|department|fiction|department|telecommunications|department|pornosec|archives|department|research|department|winston|smith|julia|obrien|parsons|syme|goldstein|ampleforth|tillotson|withers|jones|aaronson|rutherford|charrington|martin|katharine|mrs|parsons|tom|parsons|neighbour|children|old|man|pub|prole|woman|washerwoman|italian|woman|café|brotherhood|book|theory|practice|oligarchical|collectivism|high|middle|low|perpetual|war|eurasia|eastasia|airstrip|one|malabar|front|african|front|disputed|zone|floating|fortress|rocket|bomb|helicopter|thought|police|arrest|vaporization|unperson|speakwrite|memory|hole|rectification|falsification|blackwhite|doublethink|crimestop|newspeak|oldspeak|thoughtcrime|facecrime|sexcrime|ownlife|duckspeak|bellyfeel|goodthink|crimethink|prolefeed|victory|cigarettes|gin|chocolate|ration|prole|feed|outer|party|inner|party|big|brother|goldstein|hate|week|two|minutes|hate|ministry|truth|love|peace|plenty|ingsoc|telescreen|speakwrite|versificator|junior|spies|youth|league|anti|sex|league|thought|police|records|department|fiction|department|telecommunications|department|pornosec|archives|department|research|department|winston|smith|julia|obrien|parsons|syme|goldstein|ampleforth|tillotson|withers|jones|aaronson|rutherford|charrington|martin|katharine|mrs|parsons|tom|parsons|neighbour|children|old|man|pub|prole|woman|washerwoman|italian|woman|café|brotherhood|book|theory|practice|oligarchical|collectivism|high|middle|low|perpetual|war|eurasia|eastasia|airstrip|one|malabar|front|african|front|disputed|zone|floating|fortress|rocket|bomb|helicopter|thought|police|arrest|vaporization|unperson|speakwrite|memory|hole|rectification|falsification|blackwhite|doublethink|crimestop|newspeak|oldspeak|thoughtcrime|facecrime|sexcrime|ownlife|duckspeak|bellyfeel|goodthink|crimethink|prolefeed|victory|cigarettes|gin|chocolate|ration|prole|feed|outer|party|inner|party|big|brother|goldstein|hate|week|two|minutes|hate|ministry|truth|love|peace|plenty|ingsoc|telescreen|speakwrite|versificator|junior|spies|youth|league|anti|sex|league|thought|police|records|department|fiction|department|telecommunications|department|pornosec|archives|department|research|department)' THEN -0.4
      -- Neutral or mixed sentiment
      ELSE 0.0
    END as sentiment_score,
    -- Determine sentiment label
    CASE 
      WHEN LOWER(post_text) ~ '(bullish|buy|moon|pump|rise|up|gains|profit|bull|long|calls|rally|green|positive|growth|strong|optimistic|surge|breakout|boom|success|win)' THEN 'positive'
      WHEN LOWER(post_text) ~ '(bearish|sell|dump|crash|drop|down|fall|loss|bear|short|puts|red|negative|decline|weak|panic|fear|uncertainty|doubt|fud|scam)' THEN 'negative'
      ELSE 'neutral'
    END as sentiment_label,
    -- Extract basic topics
    CASE 
      WHEN LOWER(post_text) ~ '(bitcoin|btc|crypto|ethereum|eth|altcoin|defi|nft|web3|blockchain|satoshi|hodl|diamond|hands)' THEN ARRAY['crypto']
      WHEN LOWER(post_text) ~ '(stock|market|dow|nasdaq|s&p|spy|trading|invest|wall|street|bull|bear|market|volatility|options|futures)' THEN ARRAY['trading']
      WHEN LOWER(post_text) ~ '(fed|federal|reserve|interest|rate|inflation|economy|gdp|unemployment|cpi|ppi|monetary|policy|fiscal|policy)' THEN ARRAY['market']
      WHEN LOWER(post_text) ~ '(trump|biden|politics|election|government|congress|senate|house|democrat|republican|policy|regulation|law|bill)' THEN ARRAY['news']
      ELSE ARRAY['community']
    END as topic_categories,
    -- Extract basic keywords
    CASE 
      WHEN LOWER(post_text) ~ '(trump|biden|fomc|fed|rate|inflation|tariff|ukraine|china|election|politics)' THEN string_to_array(
        CASE 
          WHEN LOWER(post_text) ~ 'trump' THEN 'trump'
          WHEN LOWER(post_text) ~ 'biden' THEN 'biden'  
          WHEN LOWER(post_text) ~ 'fomc' THEN 'fomc'
          WHEN LOWER(post_text) ~ 'fed' THEN 'fed'
          WHEN LOWER(post_text) ~ 'rate' THEN 'interest_rates'
          WHEN LOWER(post_text) ~ 'inflation' THEN 'inflation'
          WHEN LOWER(post_text) ~ 'tariff' THEN 'tariffs'
          WHEN LOWER(post_text) ~ 'ukraine' THEN 'ukraine'
          WHEN LOWER(post_text) ~ 'china' THEN 'china'
          WHEN LOWER(post_text) ~ 'election' THEN 'election'
          WHEN LOWER(post_text) ~ 'politics' THEN 'politics'
          ELSE 'general'
        END, ','
      )
      ELSE ARRAY['general']
    END as keywords_detected,
    -- Simple confidence score
    CASE 
      WHEN LENGTH(post_text) > 100 THEN 0.8
      WHEN LENGTH(post_text) > 50 THEN 0.6
      ELSE 0.4
    END as confidence_score,
    -- Basic emotional tone
    CASE 
      WHEN LOWER(post_text) ~ '(bullish|excited|optimistic|confident|strong|positive|win|success|boom|rally|surge|breakthrough|amazing|fantastic|awesome|love|great|excellent|happy)' THEN 'optimistic'
      WHEN LOWER(post_text) ~ '(bearish|panic|fear|worry|doubt|negative|crash|dump|fall|drop|decline|weak|bad|terrible|awful|hate|angry|frustrated|disappointed|concerned)' THEN 'pessimistic'
      WHEN LOWER(post_text) ~ '(trump|biden|politics|election|government|congress|policy|regulation|law|bill|breaking|alert|news|report|update|announcement)' THEN 'neutral'
      ELSE 'neutral'
    END as emotional_tone
  FROM x_posts 
  WHERE post_text IS NOT NULL 
    AND post_text != ''
    AND id NOT IN (
      SELECT x_post_id 
      FROM x_sentiment_analysis 
      WHERE x_post_id IS NOT NULL
    )
  ORDER BY created_at DESC
  LIMIT 50
)
INSERT INTO x_sentiment_analysis (
  x_post_id,
  sentiment_score,
  sentiment_label,
  confidence_score,
  emotional_tone,
  topic_categories,
  keywords_detected,
  analysis_metadata
)
SELECT 
  id,
  sentiment_score,
  sentiment_label,
  confidence_score,
  emotional_tone,
  topic_categories,
  keywords_detected,
  jsonb_build_object(
    'reasoning', 'Simple keyword-based sentiment analysis',
    'market_relevance', 0.7,
    'social_influence', 0.6,
    'method', 'regex_pattern_matching'
  )
FROM x_post_sentiment;