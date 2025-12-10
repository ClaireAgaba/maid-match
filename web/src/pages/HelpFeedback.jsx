import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supportAPI } from '../services/api';

const HelpFeedback = () => {
  const { user, isAdmin } = useAuth();
  const [topic, setTopic] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [replyBody, setReplyBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [satisfactionMode, setSatisfactionMode] = useState(false);
  const [wasHelped, setWasHelped] = useState(null);
  const [satisfactionComment, setSatisfactionComment] = useState('');

  const normalizeTickets = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    if (data && typeof data === 'object' && data.id) return [data];
    return [];
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await supportAPI.listTickets();
      setTickets(normalizeTickets(res.data));
    } catch (e) {
      console.error('Failed to load tickets', e);
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (ticket) => {
    setSelectedTicket(ticket);
    setSatisfactionMode(false);
    setWasHelped(ticket.was_helped);
    setSatisfactionComment(ticket.satisfaction_comment || '');
    try {
      const res = await supportAPI.getMessages(ticket.id);
      setThreadMessages(res.data || []);
    } catch (e) {
      console.error('Failed to load thread', e);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    try {
      setSubmitting(true);
      const payload = { topic, subject, body: message };
      await supportAPI.createTicket(payload);
      setSubject('');
      setMessage('');
      await loadTickets();
    } catch (e) {
      alert('Could not send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !replyBody.trim()) return;
    try {
      setSubmitting(true);
      await supportAPI.reply(selectedTicket.id, replyBody.trim());
      setReplyBody('');
      await loadThread(selectedTicket);
    } catch (e) {
      alert('Could not send reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      setSubmitting(true);
      await supportAPI.close(selectedTicket.id);
      await loadTickets();
      setSatisfactionMode(true);
    } catch (e) {
      alert('Could not close ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSatisfactionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket || wasHelped === null) return;
    try {
      setSubmitting(true);
      await supportAPI.satisfaction(selectedTicket.id, {
        was_helped: wasHelped,
        satisfaction_comment: satisfactionComment,
      });
      await loadTickets();
      setSatisfactionMode(false);
    } catch (e) {
      alert('Could not save your feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar userProfile={user} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Help &amp; Feedback</h1>
                <p className="text-sm text-gray-600">Tell us what you need help with or share feedback about MaidMatch.</p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="text-xs font-medium text-primary-600 hover:text-primary-700 underline"
            >
              ← Back to dashboard
            </Link>
          </div>

          {/* Homeowner & providers: create ticket + see your tickets */}
          {!isAdmin && (
            <>
              <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="general">General question</option>
                      <option value="technical">Technical issue / bug</option>
                      <option value="payments">Payments &amp; plans</option>
                      <option value="safety">Safety or abuse report</option>
                      <option value="suggestion">Feature suggestion</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      placeholder="Short title for your issue..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={5}
                    className="input-field text-sm"
                    placeholder="Describe your question or feedback..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Please avoid sharing very sensitive information here. Our support team will use your account details to follow up if needed.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2 text-sm"
                    disabled={submitting || !subject.trim() || !message.trim()}
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Sending...' : 'Send to support'}
                  </button>
                </div>
              </form>

              <div className="mt-8 border-t border-gray-100 pt-4">
                <h2 className="text-sm font-semibold text-gray-800 mb-2">Your support tickets</h2>
                {loading ? (
                  <p className="text-xs text-gray-500">Loading tickets...</p>
                ) : !Array.isArray(tickets) || tickets.length === 0 ? (
                  <p className="text-xs text-gray-500">You have not opened any tickets yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 text-sm">
                    {tickets.map((t) => (
                      <li key={t.id} className="py-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => loadThread(t)}
                          className="text-left flex-1 pr-3 hover:text-primary-600"
                        >
                          <p className="font-medium text-gray-900 line-clamp-1">{t.subject}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t.topic} • {t.status === 'closed' ? 'Closed' : 'Open'}
                          </p>
                        </button>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            t.status === 'closed'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {t.status === 'closed' ? 'Closed' : 'Open'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* Admin side: view all tickets and respond */}
          {isAdmin && (
            <div className="mt-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-2">Support inbox</h2>
              {loading ? (
                <p className="text-xs text-gray-500">Loading tickets...</p>
              ) : (!Array.isArray(tickets) ? [] : tickets).length === 0 ? (
                <p className="text-xs text-gray-500">No tickets yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {(!Array.isArray(tickets) ? [] : tickets).map((t) => (
                    <li key={t.id} className="py-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => loadThread(t)}
                        className="text-left flex-1 pr-3 hover:text-primary-600"
                      >
                        <p className="font-medium text-gray-900 line-clamp-1">{t.subject}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t.topic} • from {t.created_by_name} ({t.created_by_type})
                        </p>
                      </button>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          t.status === 'closed'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {t.status === 'closed' ? 'Closed' : 'Open'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Shared ticket thread panel */}
          {selectedTicket && (
            <div className="mt-8 border-t border-gray-100 pt-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-1">Ticket conversation</h2>
              <p className="text-xs text-gray-500 mb-2">{selectedTicket.subject}</p>

              <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50/50 text-xs">
                {threadMessages.length === 0 ? (
                  <p className="text-gray-500">No messages yet.</p>
                ) : (
                  threadMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`px-3 py-2 rounded-xl max-w-[80%] ${
                        m.sender_type === 'admin' ? 'ml-auto bg-primary-600 text-white' : 'mr-auto bg-white text-gray-800 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className="mt-1 text-[10px] opacity-75">
                        {m.sender_name} • {new Date(m.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply box if ticket is open */}
              {selectedTicket.status !== 'closed' && (
                <form onSubmit={handleReply} className="mt-3 space-y-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Add a reply</label>
                  <textarea
                    rows={3}
                    className="input-field text-xs"
                    placeholder={isAdmin ? 'Write a response to the user...' : 'Add more details or respond to support...'}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                  />
                  <div className="flex justify-between items-center gap-2">
                    {!isAdmin && (
                      <button
                        type="button"
                        onClick={handleCloseTicket}
                        className="text-xs text-gray-500 underline"
                        disabled={submitting}
                      >
                        Mark ticket as resolved
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn-primary flex items-center gap-2 text-xs ml-auto"
                      disabled={submitting || !replyBody.trim()}
                    >
                      <Send className="h-3 w-3" />
                      {submitting ? 'Sending...' : 'Send reply'}
                    </button>
                  </div>
                </form>
              )}

              {/* Satisfaction step after closure (homeowner side) */}
              {satisfactionMode && !isAdmin && (
                <form onSubmit={handleSatisfactionSubmit} className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-800">Were you helped? Were you satisfied with the support?</p>
                  <div className="flex gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setWasHelped(true)}
                      className={`px-3 py-1 rounded-full border text-xs ${
                        wasHelped === true ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      Yes, I was helped
                    </button>
                    <button
                      type="button"
                      onClick={() => setWasHelped(false)}
                      className={`px-3 py-1 rounded-full border text-xs ${
                        wasHelped === false ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      Not really
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    className="input-field text-xs"
                    placeholder="Share any quick feedback on how we handled this..."
                    value={satisfactionComment}
                    onChange={(e) => setSatisfactionComment(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="btn-secondary text-xs"
                      disabled={submitting || wasHelped === null}
                    >
                      {submitting ? 'Saving...' : 'Submit feedback'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpFeedback;
