'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Misc';
import { useToast } from '@/components/ui/Toast';
import { sendMessageAction, markConversationReadAction } from '@/lib/actions/messages';
import { formatDateTime } from '@/lib/utils';

interface ChatMessage {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
}

export function ChatRoom({
  conversationId,
  otherName,
  selfId,
  initialMessages,
  blocked
}: {
  conversationId: string;
  otherName: string;
  selfId: string;
  initialMessages: ChatMessage[];
  blocked?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string>(initialMessages[initialMessages.length - 1]?.id ?? '');
  const { toast } = useToast();
  const router = useRouter();

  const markRead = useCallback(async () => {
    await markConversationReadAction(conversationId);
  }, [conversationId]);

  useEffect(() => {
    markRead();
  }, [markRead]);

  // Poll for new messages every 4 seconds.
  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const after = lastIdRef.current;
        const res = await fetch(`/api/conversations/${conversationId}/messages?after=${after}`, {
          cache: 'no-store'
        });
        if (!res.ok) return;
        const json = (await res.json()) as { ok?: boolean; data?: ChatMessage[] };
        if (!json.ok || !json.data || json.data.length === 0) return;
        if (!alive) return;
        const newMsgs = json.data.filter((m) => m.id !== lastIdRef.current);
        if (newMsgs.length > 0) {
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            return [...prev, ...newMsgs.filter((m) => !known.has(m.id))];
          });
          lastIdRef.current = newMsgs[newMsgs.length - 1].id;
        }
        markRead();
      } catch {
        /* ignore */
      }
    }
    poll();
    const t = setInterval(poll, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [conversationId, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  function send() {
    const body = draft.trim();
    if (!body) return;
    startTransition(async () => {
      const res = await sendMessageAction(conversationId, body);
      if (!res.ok) {
        toast('error', res.error);
        return;
      }
      setDraft('');
      // Optimistic: wait for the poll to pick it up; but fetch immediately for snappiness.
      pollOnce();
    });
  }

  async function pollOnce() {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages?after=${lastIdRef.current}`, {
        cache: 'no-store'
      });
      if (!res.ok) return;
      const json = (await res.json()) as { ok?: boolean; data?: ChatMessage[] };
      if (json.ok && json.data) {
        const newMsgs = json.data.filter((m) => m.id !== lastIdRef.current);
        if (newMsgs.length > 0) {
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            return [...prev, ...newMsgs.filter((m) => !known.has(m.id))];
          });
          lastIdRef.current = newMsgs[newMsgs.length - 1].id;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex h-[calc(100dvh-16rem)] min-h-[420px] flex-col md:h-[calc(100dvh-13rem)]">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Link
          href="/messages"
          className="btn-ghost !rounded-full !p-2"
          aria-label="العودة للمحادثات"
          onClick={() => router.refresh()}
        >
          <Icon name="chevron-right" size={18} />
        </Link>
        <div>
          <h1 className="text-sm font-bold">{otherName}</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {blocked ? 'تم الحظر — الإرسال معطل' : 'متصل الآن'}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-4 dark:bg-slate-950/40">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            لا توجد رسائل بعد — ابدأ المحادثة
          </div>
        )}
        {messages.map((m) => {
          const mine = m.senderId === selfId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                  mine
                    ? 'rounded-bl-md bg-brand-600 text-white'
                    : 'rounded-br-md bg-white text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700'
                }`}
              >
                <p className="whitespace-pre-wrap break-words" dir="auto">
                  {m.body}
                </p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-slate-400'}`}>
                  {formatDateTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        {blocked ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-center text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            لا يمكنك الإرسال في هذه المحادثة بسبب الحظر
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <label htmlFor="msg-input" className="sr-only">
              اكتب رسالتك
            </label>
            <textarea
              id="msg-input"
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="اكتب رسالتك هنا..."
              className="input max-h-32 min-h-11 flex-1 resize-none"
            />
            <button
              type="button"
              onClick={send}
              disabled={pending || !draft.trim()}
              className="btn-primary !rounded-xl !p-3"
              aria-label="إرسال"
            >
              {pending ? <Spinner className="h-4 w-4" /> : <Icon name="send" size={16} className="-scale-x-100" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
