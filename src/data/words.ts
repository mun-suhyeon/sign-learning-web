export interface Word {
  id: string
  text: string
  category: string
}

/** 거울 연습용 기초 단어. 동작은 국립국어원 한국수어사전 영상을 보고 따라 한다. */
export const WORDS: Word[] = [
  { id: 'hello', text: '안녕하세요', category: '인사' },
  { id: 'thanks', text: '감사합니다', category: '인사' },
  { id: 'sorry', text: '미안합니다', category: '인사' },
  { id: 'nice', text: '반갑습니다', category: '인사' },
  { id: 'okay', text: '괜찮다', category: '인사' },
  { id: 'yes', text: '네', category: '대답' },
  { id: 'no', text: '아니요', category: '대답' },
  { id: 'know', text: '알다', category: '대답' },
  { id: 'dontknow', text: '모르다', category: '대답' },
  { id: 'name', text: '이름', category: '자기소개' },
  { id: 'me', text: '나', category: '자기소개' },
  { id: 'you', text: '너', category: '자기소개' },
  { id: 'friend', text: '친구', category: '사람' },
  { id: 'family', text: '가족', category: '사람' },
  { id: 'deaf', text: '농인', category: '사람' },
  { id: 'help', text: '돕다', category: '생활' },
  { id: 'water', text: '물', category: '생활' },
  { id: 'rice', text: '밥', category: '생활' },
  { id: 'toilet', text: '화장실', category: '생활' },
  { id: 'school', text: '학교', category: '생활' },
  { id: 'love', text: '사랑', category: '감정' },
  { id: 'happy', text: '기쁘다', category: '감정' },
]

/** 지문자 철자 연습용 단어 (받침·복합모음 없이 기본 자모로만 구성) */
export const SPELLING_WORDS = ['나무', '바다', '사자', '노루', '가수', '모자', '하마', '포도', '기차', '우유', '두부', '시소', '오이', '나비', '두더지']
