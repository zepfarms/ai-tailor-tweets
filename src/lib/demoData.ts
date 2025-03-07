
import { DemoData } from './types';

// Generate a UUID for demo data
const generateDemoId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Generate dates for demo data
const getPastDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

const getFutureDate = (daysAhead: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString();
};

// Demo data that will be shown when using the demo account
export const demoData: DemoData = {
  posts: {
    scheduledPosts: [
      {
        id: generateDemoId(),
        content: "Excited to announce our upcoming webinar on content creation strategies! Mark your calendars for next week. #ContentCreation #DigitalMarketing",
        scheduled_for: getFutureDate(3),
        published: false,
        created_at: getPastDate(1),
        user_id: "demo-user-id"
      },
      {
        id: generateDemoId(),
        content: "Tips for effective social media management: 1) Plan your content calendar 2) Use analytics to understand your audience 3) Engage with your followers regularly #SocialMediaTips",
        scheduled_for: getFutureDate(5),
        published: false,
        created_at: getPastDate(2),
        user_id: "demo-user-id"
      },
      {
        id: generateDemoId(),
        content: "Join us for a live Q&A session with our team! We'll be discussing the latest trends in social media marketing and answering all your burning questions.",
        scheduled_for: getFutureDate(7),
        published: false,
        created_at: getPastDate(3),
        user_id: "demo-user-id"
      }
    ],
    publishedPosts: [
      {
        id: generateDemoId(),
        content: "Check out our latest blog post on 'Mastering Content Creation in 2023' - full of practical tips you can implement today! #ContentMarketing",
        published: true,
        created_at: getPastDate(5),
        user_id: "demo-user-id"
      },
      {
        id: generateDemoId(),
        content: "Did you know that consistent posting increases engagement by up to 40%? Start your content calendar today! #SocialMediaStrategy",
        published: true,
        created_at: getPastDate(7),
        user_id: "demo-user-id"
      },
      {
        id: generateDemoId(),
        content: "Throwback to our amazing workshop last month! Thank you to everyone who participated and shared their insights. Looking forward to the next one! #CommunityEngagement",
        published: true,
        created_at: getPastDate(14),
        user_id: "demo-user-id"
      },
      {
        id: generateDemoId(),
        content: "We've just updated our platform with exciting new features! Log in to check them out and let us know what you think. #ProductUpdate #NewFeatures",
        published: true,
        created_at: getPastDate(21),
        user_id: "demo-user-id"
      }
    ]
  }
};
