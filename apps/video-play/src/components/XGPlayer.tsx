import { DatePicker, Select, ConfigProvider } from 'antd';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Player, { I18N } from 'xgplayer';
import 'xgplayer/dist/index.min.css';
import ZH_CN from 'xgplayer/es/lang/zh-cn';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import zh_CN from 'antd/es/locale/zh_CN';

dayjs.locale('zh-cn');

// eslint-disable-next-line react-hooks/rules-of-hooks
I18N.use(ZH_CN);

const request = axios.create({ baseURL: `http://${window.location.hostname}:11212` });
request.interceptors.response.use((res) => res.data);

export const XGPlayer = () => {
  const ref: any = useRef();
  const cache = useMemo<any>(() => ({ player: null, params: { channel: '', date: '', video: '' } }), []);
  const [channels, setChannels] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>({ channel: '', video: '', date: dayjs() });

  const getList = useCallback(async () => {
    const list = await request.get(`/api/search?date=${cache.params.date}&channel=${cache.params.channel}`);
    console.log(list);
    return list;
  }, []);

  const getUrl = useCallback(() => {
    const url = `http://${window.location.hostname}:11212/${cache.params.channel}/${cache.params.date}/${cache.params.video}`;
    console.log(url);
    return url;
  }, []);

  const init = useCallback(async () => {
    const ch: any[] = await request.get('/api/channels');
    setChannels(ch);

    if (ch.length < 1 || !ch[0].id) {
      return;
    }
    cache.params = { date: current.date.format('YYYYMMDD'), channel: ch[0].id, video: '' };

    const l: any = await getList();
    if (l.length < 0) {
      return;
    }

    setList(l);
    cache.params.video = l[0];
    cache.player?.setConfig({
      url: getUrl(),
    });
    cache.player?.play();
    setCurrent((old: any) => ({ ...old, channel: ch[0].id, video: l[0] }));
  }, []);

  const updateList = useCallback(async () => {
    const l: any = await getList();
    if (l.length < 0) {
      return;
    }

    setList(l);
    setCurrent((o: any) => ({ ...o, video: l[0] }));
    cache.params.video = l[0];
    if (!cache.player) {
      return;
    }

    cache.player.playNext({
      url: getUrl(),
      autoplay: true,
    });
  }, []);

  useEffect(() => {
    cache.player = new Player({
      autoplayMuted: true,
      el: ref.current,
      lang: 'zh-cn',
      width: 900,
      height: 600,
      videoInit: false,
    });

    return () => {
      cache.player?.destroy();
    };
  }, []);

  useEffect(() => {
    init();
  }, []);

  return (
    <ConfigProvider locale={zh_CN}>
      <div style={{ width: '100%', paddingTop: 50, display: 'flex', justifyContent: 'center' }}>
        <div style={{ height: '600px', display: 'flex', justifyContent: 'center' }}>
          <div ref={ref} style={{ width: 900, height: 600 }} />
          <div style={{ width: 280, border: '1px solid #ccc', borderLeft: 'none' }}>
            <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
              <DatePicker
                style={{ width: 120 }}
                value={current.date}
                onChange={async (value) => {
                  cache.params.date = value.format('YYYYMMDD');
                  setCurrent((o: any) => ({ ...o, date: value }));

                  updateList();
                }}
              />
              <Select
                value={current.channel}
                style={{ width: '120px', marginLeft: 10, fontSize: 14 }}
                onChange={async (value) => {
                  setCurrent((o: any) => ({ ...o, channel: value }));
                  cache.params.channel = value;
                  updateList();
                }}
                options={channels.map((item) => {
                  return { label: item.name, value: item.id };
                })}
              />
            </div>

            <div style={{ overflowY: 'auto', height: 'calc(100% - 60px)' }}>
              {list.map((item) => (
                <div
                  style={{
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: 12,
                    background: current.video === item ? '#bbbbbc' : 'none',
                  }}
                  key={item}
                  onClick={() => {
                    setCurrent((o: any) => ({ ...o, video: item }));
                    cache.params.video = item;
                    if (cache.player) {
                      cache.player.playNext({ url: getUrl(), autoplay: true });
                    }
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};
