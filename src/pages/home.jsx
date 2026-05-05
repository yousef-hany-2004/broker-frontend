import React, { useState } from 'react'

const chatListData = [
  {
    id: 1,
    name: 'Paarth Jain',
    role: 'Online',
    avatar: 'PJ',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    last: 'Lorem ipsum is simply dummy text of the printing display…',
    messages: [
        { id: 'm1', from: 'them', text: 'مرحبا بك  ' },
  
    ],
     
  },
  {
    id: 2,
    name: 'Gaurav Mehta',
    role: 'Offline',
    avatar: 'GM',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    last: 'Lorem ipsum is simply dummy text of the printing display…',
    messages: [
      { id: 'm1', from: 'them', text: 'مرحبا بك ' },
    ],
  },
  {
    id: 3,
    name: 'Sagnik Chakraborty',
    role: 'Busy',
    avatar: 'SC',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    last: 'Lorem ipsum is simply dummy text of the printing display…',
    messages: [
      { id: 'm1', from: 'them', text: 'مرحبا بك' },
    ],
  },
]

const currentUser = {
  name: 'أنت',
  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
}

function Home() {
  const [activeTab, setActiveTab] = useState('chat')
  const [chatList, setChatList] = useState(chatListData)
  const [selectedId, setSelectedId] = useState(1)
  const [draft, setDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredChats = chatList.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const activeChat = chatList.find((chat) => chat.id === selectedId) ?? chatList[0]  
  const getStatusColor = (status) => {
    if (status === 'Online') return 'bg-green-500'
    if (status === 'Offline') return 'bg-gray-500'
    if (status === 'Busy') return 'bg-orange-500'
    return 'bg-gray-500'
  }
  return (
    <div 
      className="fixed inset-0 min-h-screen w-screen text-white overflow-auto"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Blur Overlay */}
      <div 
        className="fixed inset-0 bg-[#080707]/30 backdrop-blur-lg pointer-events-none"
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 py-6 lg:px-8">
        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="flex rounded-full border border-[#5d4a21]/40 bg-[#0f0d0f]/90 p-1 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                activeTab === 'chat'
                  ? 'bg-[#d0b76d] text-black'
                  : 'text-[#d0b76d] hover:bg-[#d0b76d]/20'
              }`}
            >
              الدردشة
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                activeTab === 'contacts'
                  ? 'bg-[#d0b76d] text-black'
                  : 'text-[#d0b76d] hover:bg-[#d0b76d]/20'
              }`}
            >
              قائمة الأسماء
            </button>
          </div>
        </div>

        {activeTab === 'chat' && (
          <div className="grid flex-1 gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="rounded-[32px] border border-[#5d4a21]/40 bg-[#0f0d0f]/90 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between gap-4 rounded-[28px] border border-[#d0b76d]/30 bg-[#151215]/80 px-4 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#d0b76d]">Aquakeys Chat</p>
                </div>
                <img 
                  src={currentUser.image} 
                  alt={currentUser.name}
                  className="h-10 w-10 rounded-full border-2 border-[#d0b76d] object-cover shadow-lg"
                />
              </div>

              <div className="mt-4 mb-4">
                <input
                  type="text"
                  placeholder="search about a name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-[20px] border border-[#d0b76d]/40 bg-[#121010]/70 px-4 py-2 text-sm text-white placeholder:text-[#88806d] outline-none focus:border-[#d0b76d] transition"
                />
              </div>

              <div className="space-y-3 overflow-y-auto pr-1">
                {filteredChats.map((chat) => {
                  const isActive = chat.id === selectedId
                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => setSelectedId(chat.id)}
                      className={`w-full rounded-[28px] border px-4 py-4 text-left transition ${
                        isActive
                          ? 'border-[#d0b76d] bg-[#1f1b18]/80 shadow-[0_10px_40px_rgba(208,183,109,0.12)]'
                          : 'border-transparent bg-[#121010]/70 hover:border-[#d0b76d]/40 hover:bg-[#191616]/90'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e1a16] text-sm font-semibold text-[#d0b76d]">
                          {chat.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-white">{chat.name}</p>
                            <div className="flex items-center gap-1">
                              <div className={`h-2 w-2 rounded-full ${getStatusColor(chat.role)}`}></div>
                              <span className="text-[11px] uppercase tracking-[0.24em] text-[#b7a36d]">
                                {chat.role}
                              </span>
                            </div>
                          </div>
                          <p className="mt-1 truncate text-sm text-[#aaa39d]">{chat.last}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </aside>

            <section className="flex min-h-[640px] flex-col overflow-hidden rounded-[32px] border border-[#5d4a21]/40 bg-[#0d0c0f]/90 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <header className="flex items-center justify-between border-b border-[#5d4a21]/30 bg-[#130f12]/90 px-6 py-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={activeChat.image} 
                    alt={activeChat.name}
                    className="h-14 w-14 rounded-full border-2 border-[#d0b76d] object-cover shadow-lg"
                  />
                  <div>
                    <p className="text-base font-semibold text-white">{activeChat.name}</p>
                    <p className="text-sm text-[#aaa39d]">{activeChat.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#b7a36d] uppercase tracking-[0.2em]">You:</span>
                  <span className="text-sm font-semibold text-white">{currentUser.name}</span>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-4">
                  {activeChat.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex flex-col ${
                        message.from === 'me' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <span className="text-xs text-[#b7a36d] mb-1 uppercase tracking-[0.2em]">
                        {message.from === 'me' ? currentUser.name : activeChat.name}
                      </span>
                      <div
                        className={`max-w-[82%] ${
                          message.from === 'me' ? 'bg-[#1e1915]' : 'bg-[#161217]'
                        } rounded-3xl px-5 py-4 text-sm text-[#e7e1d0] shadow-[0_10px_30px_rgba(0,0,0,0.12)]`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#5d4a21]/30 bg-[#130f12]/90 px-6 py-5">
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!draft.trim()) return
                    const newMessage = {
                      id: `m-${Date.now()}`,
                      from: 'me',
                      text: draft.trim(),
                    }
                    setChatList((currentChats) =>
                      currentChats.map((chat) =>
                        chat.id === selectedId
                          ? { ...chat, messages: [...chat.messages, newMessage] }
                          : chat
                      )
                    )
                    setDraft('')
                  }}
                  className="flex items-center gap-3 rounded-full border border-[#5d4a21]/40 bg-[#151214]/90 px-4 py-3"
                >
                  <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1b1714]/90 text-[#d0b76d] transition hover:bg-[#2a231f]/90">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </button>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Type your message here"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-[#88806d] outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[#d0b76d]/90 via-[#b38d4e]/90 to-[#a2863d]/90 px-4 text-sm font-semibold text-black transition hover:brightness-110"
                  >
                    Send
                  </button>
                </form>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="flex justify-center">
            <aside className="w-full max-w-md rounded-[32px] border border-[#5d4a21]/40 bg-[#0f0d0f]/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between gap-4 rounded-[28px] border border-[#d0b76d]/30 bg-[#151215]/80 px-4 py-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#d0b76d]">Aquakeys Chat</p>
                </div>
                <img 
                  src={currentUser.image} 
                  alt={currentUser.name}
                  className="h-10 w-10 rounded-full border-2 border-[#d0b76d] object-cover shadow-lg"
                />
              </div>

              <div className="mt-4 mb-4">
                <input
                  type="text"
                  placeholder="ابحث عن اسم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-[20px] border border-[#d0b76d]/40 bg-[#121010]/70 px-4 py-2 text-sm text-white placeholder:text-[#88806d] outline-none focus:border-[#d0b76d] transition"
                />
              </div>

              <div className="space-y-4">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setSelectedId(chat.id)
                      setActiveTab('chat')
                    }}
                    type="button"
                    className="w-full rounded-[28px] border border-transparent bg-[#121010]/70 px-4 py-4 text-left transition hover:border-[#d0b76d]/40 hover:bg-[#191616]/90"
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={chat.image} 
                        alt={chat.name}
                        className="h-12 w-12 rounded-full border-2 border-[#d0b76d] object-cover shadow-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-white">{chat.name}</p>
                          <div className="flex items-center gap-1">
                            <div className={`h-2 w-2 rounded-full ${getStatusColor(chat.role)}`}></div>
                            <span className="text-[11px] uppercase tracking-[0.24em] text-[#b7a36d]">
                              {chat.role}
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 truncate text-sm text-[#aaa39d]">{chat.last}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home

