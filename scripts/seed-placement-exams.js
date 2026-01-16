/**
 * Seed Placement Exams Script
 * This script adds properly formatted placement exams to the database
 */

const path = require('path');

// Use mongoose from backend's node_modules
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));

// Import the Exam model from backend
const Exam = require(path.join(__dirname, '../backend/models/Exam'));
const User = require(path.join(__dirname, '../backend/models/User'));

const PLACEMENT_EXAMS = [
  {
    title: "Software Fresher Technical Assessment",
    company: "TechCorp Solutions",
    type: "PLACEMENT_QUIZ",
    description: "Comprehensive technical assessment covering core computer science concepts for entry-level software engineering positions.",
    duration: 45,
    maxViolations: 3,
    passingPercentage: 60,
    instructions: [
      "Read each question carefully before answering.",
      "Do not switch windows or tabs during the exam.",
      "All activity is monitored and logged.",
      "The exam will auto-submit when time expires or violations exceed the limit.",
      "You can navigate between questions using the question palette."
    ],
    isActive: true,
    questions: [
      {
        prompt: "What is JVM (Java Virtual Machine)?",
        options: [
          "A hardware component that runs Java code",
          "A runtime environment that executes Java bytecode",
          "A compiler that converts Java to machine code",
          "An IDE for Java development"
        ],
        correctOptionIndex: 1,
        category: "Java",
        difficulty: "Easy",
        explanation: "JVM is a runtime environment that executes Java bytecode, providing platform independence."
      },
      {
        prompt: "Which data structure follows FIFO (First In First Out) principle?",
        options: [
          "Stack",
          "Queue",
          "Binary Tree",
          "Hash Table"
        ],
        correctOptionIndex: 1,
        category: "DSA",
        difficulty: "Easy",
        explanation: "Queue follows FIFO principle where the first element added is the first one to be removed."
      },
      {
        prompt: "What is the time complexity of binary search algorithm?",
        options: [
          "O(n)",
          "O(log n)",
          "O(n²)",
          "O(1)"
        ],
        correctOptionIndex: 1,
        category: "DSA",
        difficulty: "Medium",
        explanation: "Binary search has O(log n) complexity as it halves the search space with each comparison."
      },
      {
        prompt: "Which SQL clause is used to filter records before grouping?",
        options: [
          "ORDER BY",
          "GROUP BY",
          "WHERE",
          "HAVING"
        ],
        correctOptionIndex: 2,
        category: "SQL",
        difficulty: "Easy",
        explanation: "WHERE clause filters records before GROUP BY, while HAVING filters after grouping."
      },
      {
        prompt: "What is the worst-case time complexity of QuickSort?",
        options: [
          "O(n log n)",
          "O(n²)",
          "O(n)",
          "O(log n)"
        ],
        correctOptionIndex: 1,
        category: "DSA",
        difficulty: "Medium",
        explanation: "QuickSort has O(n²) worst-case when the pivot selection is poor (e.g., already sorted array)."
      },
      {
        prompt: "Which OS concept allows multiple processes to run concurrently?",
        options: [
          "Paging",
          "CPU Scheduling",
          "Deadlock Prevention",
          "Memory Allocation"
        ],
        correctOptionIndex: 1,
        category: "OS",
        difficulty: "Medium",
        explanation: "CPU Scheduling manages process execution to achieve multitasking and concurrency."
      },
      {
        prompt: "What is normalization in databases?",
        options: [
          "Increasing data redundancy",
          "Organizing data to reduce redundancy and dependency",
          "Converting data to uppercase",
          "Encrypting database records"
        ],
        correctOptionIndex: 1,
        category: "DBMS",
        difficulty: "Medium",
        explanation: "Normalization organizes database tables to minimize redundancy and improve data integrity."
      },
      {
        prompt: "Which Java keyword is used to define a constant?",
        options: [
          "static",
          "final",
          "const",
          "constant"
        ],
        correctOptionIndex: 1,
        category: "Java",
        difficulty: "Easy",
        explanation: "The 'final' keyword makes a variable constant - its value cannot be changed after initialization."
      },
      {
        prompt: "What is a deadlock in operating systems?",
        options: [
          "A fast execution state",
          "A situation where processes wait indefinitely for resources",
          "A memory management technique",
          "A type of CPU scheduling"
        ],
        correctOptionIndex: 1,
        category: "OS",
        difficulty: "Medium",
        explanation: "Deadlock occurs when processes are blocked forever, each waiting for resources held by others."
      },
      {
        prompt: "Which data structure is used to implement function call stack?",
        options: [
          "Queue",
          "Stack",
          "Linked List",
          "Array"
        ],
        correctOptionIndex: 1,
        category: "DSA",
        difficulty: "Easy",
        explanation: "Stack (LIFO) is used for function calls - the last called function returns first."
      }
    ]
  },
  {
    title: "Data Structures & Algorithms Assessment",
    company: "CodeMasters Inc",
    type: "PLACEMENT_QUIZ",
    description: "Advanced DSA assessment focusing on problem-solving skills and algorithmic thinking.",
    duration: 60,
    maxViolations: 3,
    passingPercentage: 65,
    instructions: [
      "This exam tests your DSA knowledge.",
      "Focus on time and space complexity analysis.",
      "Do not use external resources during the exam.",
      "All activity is monitored."
    ],
    isActive: true,
    questions: [
      {
        prompt: "What is the space complexity of merge sort?",
        options: [
          "O(1)",
          "O(n)",
          "O(log n)",
          "O(n²)"
        ],
        correctOptionIndex: 1,
        category: "DSA",
        difficulty: "Medium",
        explanation: "Merge sort requires O(n) additional space for the temporary arrays during merging."
      },
      {
        prompt: "Which traversal visits nodes in the order: Left, Root, Right?",
        options: [
          "Preorder",
          "Inorder",
          "Postorder",
          "Level order"
        ],
        correctOptionIndex: 1,
        category: "DSA",
        difficulty: "Easy",
        explanation: "Inorder traversal visits left subtree, then root, then right subtree."
      },
      {
        prompt: "What is the best case time complexity of Bubble Sort?",
        options: [
          "O(n²)",
          "O(n)",
          "O(n log n)",
          "O(1)"
        ],
        correctOptionIndex: 1,
        category: "DSA",
        difficulty: "Medium",
        explanation: "With optimization, Bubble Sort achieves O(n) when array is already sorted."
      },
      {
        prompt: "Which data structure is best for implementing LRU cache?",
        options: [
          "Array",
          "Stack",
          "HashMap + Doubly Linked List",
          "Binary Tree"
        ],
        correctOptionIndex: 2,
        category: "DSA",
        difficulty: "Hard",
        explanation: "HashMap provides O(1) lookup while DLL maintains order for efficient eviction."
      },
      {
        prompt: "What is the height of a complete binary tree with n nodes?",
        options: [
          "O(n)",
          "O(log n)",
          "O(n²)",
          "O(1)"
        ],
        correctOptionIndex: 1,
        category: "DSA",
        difficulty: "Medium",
        explanation: "A complete binary tree has height O(log n) as each level doubles the capacity."
      },
      {
        prompt: "Which algorithm is used to find shortest path in weighted graph?",
        options: [
          "BFS",
          "DFS",
          "Dijkstra's Algorithm",
          "Binary Search"
        ],
        correctOptionIndex: 2,
        category: "DSA",
        difficulty: "Medium",
        explanation: "Dijkstra's algorithm finds shortest paths from a source to all vertices in weighted graphs."
      },
      {
        prompt: "What is the time complexity of inserting at the beginning of an ArrayList?",
        options: [
          "O(1)",
          "O(n)",
          "O(log n)",
          "O(n²)"
        ],
        correctOptionIndex: 1,
        category: "DSA",
        difficulty: "Easy",
        explanation: "Inserting at beginning requires shifting all existing elements, hence O(n)."
      },
      {
        prompt: "Which sorting algorithm is stable?",
        options: [
          "Quick Sort",
          "Heap Sort",
          "Merge Sort",
          "Selection Sort"
        ],
        correctOptionIndex: 2,
        category: "DSA",
        difficulty: "Medium",
        explanation: "Merge Sort is stable - it preserves the relative order of equal elements."
      },
      {
        prompt: "What data structure is used in BFS traversal?",
        options: [
          "Stack",
          "Queue",
          "Heap",
          "Hash Table"
        ],
        correctOptionIndex: 1,
        category: "DSA",
        difficulty: "Easy",
        explanation: "BFS uses Queue to process nodes level by level in FIFO order."
      },
      {
        prompt: "What is the average time complexity of HashMap operations?",
        options: [
          "O(n)",
          "O(1)",
          "O(log n)",
          "O(n²)"
        ],
        correctOptionIndex: 1,
        category: "DSA",
        difficulty: "Easy",
        explanation: "HashMap provides O(1) average time for get, put, and remove operations."
      }
    ]
  },
  {
    title: "Database & SQL Fundamentals",
    company: "DataSphere Technologies",
    type: "PLACEMENT_QUIZ",
    description: "Assessment covering SQL queries, database design, and DBMS concepts.",
    duration: 30,
    maxViolations: 3,
    passingPercentage: 60,
    instructions: [
      "This exam focuses on database concepts.",
      "Pay attention to SQL syntax.",
      "Do not switch tabs during the exam."
    ],
    isActive: true,
    questions: [
      {
        prompt: "Which SQL statement is used to extract data from a database?",
        options: [
          "GET",
          "SELECT",
          "EXTRACT",
          "PULL"
        ],
        correctOptionIndex: 1,
        category: "SQL",
        difficulty: "Easy",
        explanation: "SELECT statement is used to query and retrieve data from database tables."
      },
      {
        prompt: "What is a primary key in a database?",
        options: [
          "A key that can have duplicate values",
          "A unique identifier for each record in a table",
          "A foreign reference to another table",
          "An encryption key"
        ],
        correctOptionIndex: 1,
        category: "DBMS",
        difficulty: "Easy",
        explanation: "Primary key uniquely identifies each record and cannot contain NULL values."
      },
      {
        prompt: "Which JOIN returns only matching rows from both tables?",
        options: [
          "LEFT JOIN",
          "RIGHT JOIN",
          "INNER JOIN",
          "FULL OUTER JOIN"
        ],
        correctOptionIndex: 2,
        category: "SQL",
        difficulty: "Medium",
        explanation: "INNER JOIN returns only rows where there is a match in both tables."
      },
      {
        prompt: "What is ACID in database transactions?",
        options: [
          "A programming language",
          "Atomicity, Consistency, Isolation, Durability",
          "A type of database",
          "A SQL command"
        ],
        correctOptionIndex: 1,
        category: "DBMS",
        difficulty: "Medium",
        explanation: "ACID properties ensure reliable database transactions."
      },
      {
        prompt: "Which normal form removes partial dependencies?",
        options: [
          "1NF",
          "2NF",
          "3NF",
          "BCNF"
        ],
        correctOptionIndex: 1,
        category: "DBMS",
        difficulty: "Hard",
        explanation: "2NF eliminates partial dependencies on the primary key."
      },
      {
        prompt: "What does the GROUP BY clause do?",
        options: [
          "Sorts the result set",
          "Groups rows with same values into summary rows",
          "Filters records",
          "Joins tables"
        ],
        correctOptionIndex: 1,
        category: "SQL",
        difficulty: "Easy",
        explanation: "GROUP BY groups rows with identical values for aggregate functions."
      },
      {
        prompt: "Which index type is best for range queries?",
        options: [
          "Hash Index",
          "B-Tree Index",
          "Bitmap Index",
          "Full-text Index"
        ],
        correctOptionIndex: 1,
        category: "DBMS",
        difficulty: "Medium",
        explanation: "B-Tree indexes support range queries efficiently due to their sorted structure."
      },
      {
        prompt: "What is a foreign key?",
        options: [
          "A key from another country",
          "A field that references the primary key of another table",
          "An encrypted key",
          "A unique identifier"
        ],
        correctOptionIndex: 1,
        category: "DBMS",
        difficulty: "Easy",
        explanation: "Foreign key establishes referential integrity between two tables."
      }
    ]
  },
  {
    title: "Java Programming Fundamentals",
    company: "JavaSoft Enterprise",
    type: "PLACEMENT_QUIZ",
    description: "Core Java concepts including OOP, collections, and exception handling.",
    duration: 40,
    maxViolations: 3,
    passingPercentage: 60,
    instructions: [
      "Focus on Java fundamentals and OOP concepts.",
      "Read code snippets carefully.",
      "All activity is monitored."
    ],
    isActive: true,
    questions: [
      {
        prompt: "What is the default value of an int variable in Java?",
        options: [
          "null",
          "0",
          "undefined",
          "-1"
        ],
        correctOptionIndex: 1,
        category: "Java",
        difficulty: "Easy",
        explanation: "Primitive int variables have a default value of 0 in Java."
      },
      {
        prompt: "Which keyword is used to inherit a class in Java?",
        options: [
          "implements",
          "extends",
          "inherits",
          "derives"
        ],
        correctOptionIndex: 1,
        category: "Java",
        difficulty: "Easy",
        explanation: "The 'extends' keyword is used for class inheritance in Java."
      },
      {
        prompt: "What is method overloading?",
        options: [
          "Overriding parent class methods",
          "Multiple methods with same name but different parameters",
          "Loading methods at runtime",
          "Calling methods multiple times"
        ],
        correctOptionIndex: 1,
        category: "Java",
        difficulty: "Medium",
        explanation: "Method overloading allows multiple methods with same name but different signatures."
      },
      {
        prompt: "Which collection does not allow duplicate elements?",
        options: [
          "ArrayList",
          "LinkedList",
          "HashSet",
          "Vector"
        ],
        correctOptionIndex: 2,
        category: "Java",
        difficulty: "Easy",
        explanation: "HashSet implements Set interface which does not allow duplicates."
      },
      {
        prompt: "What is the purpose of the 'finally' block?",
        options: [
          "To catch exceptions",
          "To throw exceptions",
          "Code that always executes regardless of exceptions",
          "To finalize objects"
        ],
        correctOptionIndex: 2,
        category: "Java",
        difficulty: "Medium",
        explanation: "Finally block always executes, used for cleanup like closing resources."
      },
      {
        prompt: "What is encapsulation in Java?",
        options: [
          "Inheriting properties from parent class",
          "Bundling data and methods together with access control",
          "Creating multiple objects",
          "Method overriding"
        ],
        correctOptionIndex: 1,
        category: "Java",
        difficulty: "Medium",
        explanation: "Encapsulation hides internal state and requires interaction through methods."
      },
      {
        prompt: "Which keyword is used to prevent method overriding?",
        options: [
          "static",
          "final",
          "private",
          "protected"
        ],
        correctOptionIndex: 1,
        category: "Java",
        difficulty: "Easy",
        explanation: "Final methods cannot be overridden by subclasses."
      },
      {
        prompt: "What is an interface in Java?",
        options: [
          "A class that can be instantiated",
          "A blueprint with abstract methods for implementation",
          "A type of exception",
          "A collection framework"
        ],
        correctOptionIndex: 1,
        category: "Java",
        difficulty: "Medium",
        explanation: "Interface defines a contract that implementing classes must fulfill."
      },
      {
        prompt: "Which access modifier provides the most restrictive access?",
        options: [
          "public",
          "protected",
          "default",
          "private"
        ],
        correctOptionIndex: 3,
        category: "Java",
        difficulty: "Easy",
        explanation: "Private members are only accessible within the same class."
      },
      {
        prompt: "What is the difference between == and .equals() for Strings?",
        options: [
          "They are the same",
          "== compares references, .equals() compares content",
          "== is faster",
          ".equals() compares references"
        ],
        correctOptionIndex: 1,
        category: "Java",
        difficulty: "Medium",
        explanation: "== checks reference equality while .equals() checks value equality for Strings."
      }
    ]
  },
  {
    title: "Operating Systems Concepts",
    company: "SystemCore Technologies",
    type: "PLACEMENT_QUIZ",
    description: "Core OS concepts including process management, memory, and scheduling.",
    duration: 35,
    maxViolations: 3,
    passingPercentage: 55,
    instructions: [
      "Focus on OS fundamentals.",
      "Understand process and memory management.",
      "All activity is monitored."
    ],
    isActive: true,
    questions: [
      {
        prompt: "What is a process in operating systems?",
        options: [
          "A file on disk",
          "A program in execution",
          "A CPU instruction",
          "A memory address"
        ],
        correctOptionIndex: 1,
        category: "OS",
        difficulty: "Easy",
        explanation: "A process is a program in execution with its own memory space and resources."
      },
      {
        prompt: "What is virtual memory?",
        options: [
          "Physical RAM",
          "A technique that uses disk space to extend available memory",
          "Cache memory",
          "ROM memory"
        ],
        correctOptionIndex: 1,
        category: "OS",
        difficulty: "Medium",
        explanation: "Virtual memory allows running programs larger than physical RAM using disk."
      },
      {
        prompt: "Which scheduling algorithm may cause starvation?",
        options: [
          "Round Robin",
          "First Come First Serve",
          "Shortest Job First",
          "FCFS"
        ],
        correctOptionIndex: 2,
        category: "OS",
        difficulty: "Medium",
        explanation: "SJF can cause starvation for longer processes if shorter ones keep arriving."
      },
      {
        prompt: "What is a thread?",
        options: [
          "A separate process",
          "A lightweight process sharing resources with parent",
          "A CPU core",
          "A memory block"
        ],
        correctOptionIndex: 1,
        category: "OS",
        difficulty: "Easy",
        explanation: "Threads are lightweight processes that share memory with their parent process."
      },
      {
        prompt: "What is paging in memory management?",
        options: [
          "Scrolling through documents",
          "Dividing memory into fixed-size blocks",
          "Writing to disk",
          "CPU scheduling"
        ],
        correctOptionIndex: 1,
        category: "OS",
        difficulty: "Medium",
        explanation: "Paging divides memory into fixed-size frames to manage allocation efficiently."
      },
      {
        prompt: "What is a semaphore used for?",
        options: [
          "Memory allocation",
          "Process synchronization",
          "CPU scheduling",
          "File management"
        ],
        correctOptionIndex: 1,
        category: "OS",
        difficulty: "Medium",
        explanation: "Semaphores are synchronization primitives to control access to shared resources."
      },
      {
        prompt: "What is thrashing?",
        options: [
          "High CPU utilization",
          "Excessive paging causing poor performance",
          "Memory leak",
          "Fast disk access"
        ],
        correctOptionIndex: 1,
        category: "OS",
        difficulty: "Hard",
        explanation: "Thrashing occurs when system spends more time paging than executing processes."
      },
      {
        prompt: "Which condition is NOT required for deadlock?",
        options: [
          "Mutual Exclusion",
          "Hold and Wait",
          "Preemption",
          "Circular Wait"
        ],
        correctOptionIndex: 2,
        category: "OS",
        difficulty: "Hard",
        explanation: "No Preemption (not Preemption) is required. Allowing preemption prevents deadlock."
      }
    ]
  }
];

async function seedExams() {
  try {
    // Connect to MongoDB - using the same database name as the backend config
    await mongoose.connect('mongodb://127.0.0.1:27017/seb_lite');
    console.log('✅ Connected to MongoDB');

    // Find or create an admin user to be the instructor
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      // Create a default admin user (password will be auto-hashed by User model)
      adminUser = await User.create({
        name: 'Admin',
        email: 'admin@seb.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('📝 Created default admin user (admin@seb.com / admin123)');
    }

    console.log(`👤 Using instructor: ${adminUser.name} (${adminUser.email})`);

    // Delete old exams with incorrect schema
    const deleted = await mongoose.connection.db.collection('exams').deleteMany({});
    console.log(`🗑️  Deleted ${deleted.deletedCount} old exam(s)`);

    // Insert new exams
    let inserted = 0;
    for (const examData of PLACEMENT_EXAMS) {
      const existingExam = await Exam.findOne({ title: examData.title });
      
      if (existingExam) {
        console.log(`⚠️  Exam "${examData.title}" already exists, skipping...`);
        continue;
      }

      const exam = new Exam({
        ...examData,
        instructor: adminUser._id
      });

      await exam.save();
      console.log(`✅ Created exam: ${examData.title} (${examData.questions.length} questions)`);
      inserted++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Total exams created: ${inserted}`);
    console.log(`   - Total exams in database: ${await Exam.countDocuments()}`);
    
    // List all exams
    const allExams = await Exam.find({}).select('title company duration isActive questions');
    console.log(`\n📝 Available Exams:`);
    allExams.forEach((exam, idx) => {
      console.log(`   ${idx + 1}. ${exam.title}`);
      console.log(`      Company: ${exam.company}`);
      console.log(`      Duration: ${exam.duration} minutes`);
      console.log(`      Questions: ${exam.questions.length}`);
      console.log(`      Status: ${exam.isActive ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error('❌ Error seeding exams:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seeding
seedExams();
